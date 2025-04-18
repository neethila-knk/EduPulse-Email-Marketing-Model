// src/scripts/finalWebhookTest.ts
// Run with: npx ts-node src/scripts/finalWebhookTest.ts 67ff42f8149ac2a9f954cb67

import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';


// Load environment variables
dotenv.config();

// Configuration
const WEBHOOK_URL = 'https://possum-square-sunfish.ngrok-free.app/api/webhooks/sendgrid';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edudb';
const DB_NAME = 'edudb'; // This is your actual database name

async function testWebhook(): Promise<void> {
  // Get campaign ID from command line args
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.error('Please provide a campaign ID as an argument');
    console.log('Usage: npx ts-node src/scripts/finalWebhookTest.ts YOUR_CAMPAIGN_ID');
    process.exit(1);
  }
  
  console.log(`Testing webhook with campaign ID: ${campaignId}`);
  
  let client: MongoClient | undefined;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database and collection
    const db = client.db(DB_NAME);
    const campaignsCollection = db.collection('campaigns');
    
    // Get current campaign metrics - PROPERLY USING ObjectId
    const campaign = await campaignsCollection.findOne({ _id: new ObjectId(campaignId) });
    
    if (!campaign) {
      console.error(`Campaign with ID ${campaignId} not found in database`);
      process.exit(1);
    }
    
    console.log(`Campaign found: ${campaign.campaignName}`);
    console.log(`Current metrics:`, campaign.metrics);
    
    // Create test events for an open and a click
    const testEvents = [
      {
        event: "open",
        email: "test@example.com",
        timestamp: Math.floor(Date.now() / 1000),
        campaignId: campaignId,
        sg_message_id: `test-msg-${Date.now()}-1`,
        sg_event_id: `test-event-${Date.now()}-1`
      },
      {
        event: "click",
        email: "test@example.com",
        timestamp: Math.floor(Date.now() / 1000),
        campaignId: campaignId,
        url: "https://example.com/test",
        sg_message_id: `test-msg-${Date.now()}-2`,
        sg_event_id: `test-event-${Date.now()}-2`
      }
    ];
    
    console.log(`Sending ${testEvents.length} test events to webhook at ${WEBHOOK_URL}`);
    
    // IMPORTANT: Send as raw data without Content-Type header to work with express.raw()
    const response = await axios.post(WEBHOOK_URL, 
      JSON.stringify(testEvents),
      {
        headers: {
          // DO NOT set Content-Type header to ensure compatibility with express.raw()
        }
      }
    );
    
    console.log('Webhook response:', response.data);
    
    // Wait a moment for database updates
    console.log('Waiting for database updates...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if metrics were updated - PROPERLY USING ObjectId
    const updatedCampaign = await campaignsCollection.findOne({ _id: new ObjectId(campaignId) });
    
    if (!updatedCampaign) {
      throw new Error("Failed to retrieve updated campaign");
    }
    
    console.log('Updated metrics:', updatedCampaign.metrics);
    
    // Calculate differences
    const openDiff = (updatedCampaign.metrics?.opens || 0) - (campaign.metrics?.opens || 0);
    const clickDiff = (updatedCampaign.metrics?.clicks || 0) - (campaign.metrics?.clicks || 0);
    
    console.log(`Metric changes: Opens +${openDiff}, Clicks +${clickDiff}`);
    
    if (openDiff === 1 && clickDiff === 1) {
      console.log('✅ SUCCESS: Webhook is working correctly! Metrics were updated.');
    } else {
      console.log('❌ FAILURE: Metrics were not updated as expected.');
      console.log('Check your webhook processing and database update logic.');
    }
  } catch (error) {
    console.error('Error testing webhook:');
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
  } finally {
    if (client) await client.close();
  }
}

// Run the test
testWebhook();