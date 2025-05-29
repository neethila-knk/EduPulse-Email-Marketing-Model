// src/controllers/searchController.ts
import { Request, Response } from 'express';
import Campaign from '../models/Campaign';

import { ObjectId } from 'mongodb';

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = new ObjectId(req.user._id);
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

  
    const campaignResults = await Campaign.find({
      userId,
      $or: [
        { campaignName: { $regex: query, $options: 'i' } },
        { subject: { $regex: query, $options: 'i' } }
      ]
    }).limit(5).lean();


    const results = {
      campaigns: campaignResults,
    };

    res.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};