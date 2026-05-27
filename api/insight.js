export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { messages, email, useCaseDescription, foundationScore, verdictLabel } = body

    // Call Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages,
      }),
    })

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text()
      return new Response(JSON.stringify({ error: 'Anthropic error', detail: err }), { status: 500 })
    }

    const data = await anthropicResponse.json()
    const text = data.content?.[0]?.text || '{}'
    const clean = text.replace(/```json[\s\S]*?```|```/g, '').trim()

    let insight = {}
    try {
      insight = JSON.parse(clean)
    } catch (e) {
      insight = { topRisk: text, firstAction: '', timeframe: '' }
    }

    // Upsert contact in Loops
    if (email && process.env.LOOPS_API_KEY) {
      try {
        await fetch('https://app.loops.so/api/v1/contacts/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: JSON.stringify({
            email,
            useCaseDescription,
            foundationScore,
            verdictLabel,
            source: 'use-case-validator',
          }),
        })

        // Send transactional email
        await fetch('https://app.loops.so/api/v1/transactional', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: JSON.stringify({
            transactionalId: 'cmpojwxxl04ov0jzp5raskegc',
            email,
            dataVariables: {
              useCaseDescription: String(useCaseDescription || ''),
              foundationScore: String(foundationScore || ''),
              verdictLabel: String(verdictLabel || ''),
              topRisk: String(insight.topRisk || ''),
              firstAction: String(insight.firstAction || ''),
              timeframe: String(insight.timeframe || ''),
            },
          }),
        })
      } catch (loopsErr) {
        // Don't fail the whole request if Loops errors
        console.error('Loops error:', loopsErr)
      }
    }

    return new Response(JSON.stringify(insight), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
