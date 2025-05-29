import Campaign from '../models/Campaign';
import { calculateCampaignMetrics } from './trackingService';

export const getAdminCampaignMetrics = async (dateRange?: { startDate: Date, endDate: Date }) => {
  try {
    let query = {};
    

    if (dateRange) {
      query = {
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      };
    }
  
    const campaigns = await Campaign.find(query).lean();
 
    let totalRecipients = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalBounces = 0;
    let totalUnsubscribes = 0;

    campaigns.forEach(campaign => {
      totalRecipients += campaign.recipientCount || 0;
      totalOpens += campaign.metrics?.opens || 0;
      totalClicks += campaign.metrics?.clicks || 0;
      totalBounces += campaign.metrics?.bounces || 0;
      totalUnsubscribes += campaign.metrics?.unsubscribes || 0;
    });

  
    const averageOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
    const averageClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0;
    const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
    const bounceRate = totalRecipients > 0 ? (totalBounces / totalRecipients) * 100 : 0;
    const unsubscribeRate = totalRecipients > 0 ? (totalUnsubscribes / totalRecipients) * 100 : 0;

   
    const campaignsWithMetrics = campaigns
      .filter(campaign => campaign.recipientCount > 0)
      .map(campaign => {
        const metrics = calculateCampaignMetrics(campaign);
        return {
          _id: campaign._id,
          campaignName: campaign.campaignName,
          recipientCount: campaign.recipientCount,
          openRate: metrics.openRate,
          clickThroughRate: metrics.clickThroughRate,
          status: campaign.status,
          createdAt: campaign.createdAt
        };
      });

  
    const topCampaigns = [...campaignsWithMetrics]
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);

 
    const bottomCampaigns = [...campaignsWithMetrics]
      .sort((a, b) => a.openRate - b.openRate)
      .slice(0, 5);

    return {
      totalCampaigns: campaigns.length,
      totalRecipients,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      averageOpenRate: parseFloat(averageOpenRate.toFixed(2)),
      averageClickRate: parseFloat(averageClickRate.toFixed(2)),
      clickToOpenRate: parseFloat(clickToOpenRate.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(2)),
      unsubscribeRate: parseFloat(unsubscribeRate.toFixed(2)),
      topCampaigns,
      bottomCampaigns
    };
  } catch (error) {
    console.error('Error getting admin campaign metrics:', error);
    throw error;
  }
};


export const generateCampaignReport = async (
  startDate: Date,
  endDate: Date,
  options: {
    groupBy?: 'day' | 'week' | 'month';
    includeInactive?: boolean;
    userId?: string;
  } = {}
) => {
  try {
    const { groupBy = 'day', includeInactive = false, userId } = options;
    
  
    const matchCriteria: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    
    if (userId) {
      matchCriteria.userId = userId;
    }
    
    
    if (!includeInactive) {
      matchCriteria.status = { $nin: ['draft', 'cancelled', 'failed'] };
    }
    

    let dateFormat;
    if (groupBy === 'month') {
      dateFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    } else if (groupBy === 'week') {
      dateFormat = { 
        year: { $year: '$createdAt' }, 
        week: { $week: '$createdAt' } 
      };
    } else {
      dateFormat = { 
        year: { $year: '$createdAt' }, 
        month: { $month: '$createdAt' }, 
        day: { $dayOfMonth: '$createdAt' } 
      };
    }
    

    const result = await Campaign.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: dateFormat,
          campaigns: { $sum: 1 },
          recipients: { $sum: '$recipientCount' },
          opens: { $sum: '$metrics.opens' },
          clicks: { $sum: '$metrics.clicks' },
          bounces: { $sum: '$metrics.bounces' },
          unsubscribes: { $sum: '$metrics.unsubscribes' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    

    const formattedResult = result.map(item => {
      let date;
      if (groupBy === 'month') {
        date = new Date(item._id.year, item._id.month - 1, 1);
      } else if (groupBy === 'week') {
        
        const firstDayOfYear = new Date(item._id.year, 0, 1);
        
        date = new Date(firstDayOfYear);
        date.setDate(firstDayOfYear.getDate() + (item._id.week - 1) * 7);
      } else {
        date = new Date(item._id.year, item._id.month - 1, item._id.day);
      }
      
    
      const openRate = item.recipients > 0 ? (item.opens / item.recipients) * 100 : 0;
      const clickRate = item.recipients > 0 ? (item.clicks / item.recipients) * 100 : 0;
      const bounceRate = item.recipients > 0 ? (item.bounces / item.recipients) * 100 : 0;
      
      return {
        date: date.toISOString(),
        formattedDate: formatDate(date, groupBy),
        campaigns: item.campaigns,
        recipients: item.recipients,
        opens: item.opens,
        clicks: item.clicks,
        bounces: item.bounces,
        unsubscribes: item.unsubscribes,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        bounceRate: parseFloat(bounceRate.toFixed(2))
      };
    });
    
    return formattedResult;
  } catch (error) {
    console.error('Error generating campaign report:', error);
    throw error;
  }
};


const formatDate = (date: Date, groupBy: 'day' | 'week' | 'month'): string => {
  const options: Intl.DateTimeFormatOptions = {};
  
  if (groupBy === 'month') {
    options.year = 'numeric';
    options.month = 'short';
  } else if (groupBy === 'week') {
    return `Week ${getWeekNumber(date)} of ${date.getFullYear()}`;
  } else {
    options.year = 'numeric';
    options.month = 'short';
    options.day = 'numeric';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};


const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};