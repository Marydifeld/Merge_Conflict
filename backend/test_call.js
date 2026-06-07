// test_call.js
// Uses global fetch (available in Node.js v18+)

async function testCall() {
  const url = 'http://localhost:3001/api/call/outbound-call';

  console.log(`Sending POST request to ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log(`Response Status: ${status}`);
      console.log('Response Body:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        console.log('✅ Test passed! Call initiated successfully.');
      } else {
        console.log('❌ Test failed! Error:', data.error || 'Unknown error');
      }
    } else {
      const text = await response.text();
      console.log(`Response Status: ${status}`);
      console.log('Response is not JSON. HTML/Text Body:');
      console.log(text);
      console.log('❌ Test failed! Server did not return JSON.');
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

testCall();
