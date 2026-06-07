// controllers/elevenLabsController.js
export const initiateOutboundCall = async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

    const toNumber = "+522213541868"; 

    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: toNumber
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'ElevenLabs failed to initiate the call.'
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: data.conversation_id
    });

  } catch (error) {
    console.error('ElevenLabs trigger error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};