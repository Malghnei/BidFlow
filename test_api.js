const http = require('http');

async function test() {
  try {
    // 1. Join event
    const joinRes = await fetch('http://localhost:3000/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: '123456' })
    });
    const joinData = await joinRes.json();
    console.log('Join Response:', joinData);
    
    // 2. Add an item
    const addItemRes = await fetch(`http://localhost:3000/api/events/${joinData.eventId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Item",
        description: "Test",
        startingBid: 50,
        image: ""
      })
    });
    const itemData = await addItemRes.json();
    console.log('Add Item Status:', addItemRes.status);
    console.log('Add Item Response:', itemData);

  } catch (err) {
    console.error(err);
  }
}

test();
