export const config = {
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, email, useCaseDescription, foundationScore, verdictLabel } = req.body

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
      console.error('Anthropic error:', err)
      return res.status(500).json({ error: 'Anthropic error', detail: err })
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

    // Save contact to Loops
    if (email && process.env.LOOPS_API_KEY) {
      try {
        const contactPayload = {
          email,
          useCaseDescription,
          foundationScore,
          verdictLabel,
          source: 'use-case-validator',
        }

        // Try create first
        const createRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: JSON.stringify(contactPayload),
        })
        const createData = await createRes.json()
        console.log('Loops create:', JSON.stringify(createData))

        // If contact already exists (409), update instead
        if (createRes.status === 409) {
          const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            },
            body: JSON.stringify(contactPayload),
          })
          const updateData = await updateRes.json()
          console.log('Loops update:', JSON.stringify(updateData))
        }

        // Send transactional email
        const txRes = await fetch('https://app.loops.so/api/v1/transactional', {
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
        const txData = await txRes.json()
        console.log('Loops transactional:', JSON.stringify(txData))

      } catch (loopsErr) {
        console.error('Loops error:', loopsErr)
      }
    }

    return res.status(200).json(insight)

  } catch (err) {
    console.error('Handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
