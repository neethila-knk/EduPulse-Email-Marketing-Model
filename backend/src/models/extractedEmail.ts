
import mongoose, { Document, Schema } from 'mongoose';


export interface EmailResult {
  Email: string;
  'Keyword Category': string;
}


export interface IEmailExtractionJob extends Document {
  keywords: string;
  category: string;
  max_pages: number;
  status: 'queued' | 'starting' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_emails: number;
  keywords_processed: number;
  total_keywords: number;
  results: EmailResult[];
  error: string | null;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}


const EmailExtractionJobSchema = new Schema<IEmailExtractionJob>(
  {
    keywords: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: '',
    },
    max_pages: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['queued', 'starting', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    progress: {
      type: Number,
      default: 0,
    },
    total_emails: {
      type: Number,
      default: 0,
    },
    keywords_processed: {
      type: Number,
      default: 0,
    },
    total_keywords: {
      type: Number,
      default: 0,
    },
    results: [
      {
        Email: String,
        'Keyword Category': String,
      },
    ],
    error: {
      type: String,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Admin', 
      required: true,
    },
  },
  { timestamps: true }
);


const EmailExtractionJob = mongoose.model<IEmailExtractionJob>('EmailExtractionJob', EmailExtractionJobSchema);

export default EmailExtractionJob;