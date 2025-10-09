# Usage Reset Cron Job Setup

This document explains how to set up automatic monthly usage reset for the CueMe subscription system.

## API Endpoint

The usage reset is handled by: `/api/usage/reset`

## Authentication

The endpoint requires a Bearer token with the `CRON_SECRET` environment variable value.

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployment)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/usage/reset",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

2. Add environment variable in Vercel dashboard:

   - `CRON_SECRET=your-secure-secret-key`

3. Update the API endpoint to accept Vercel's cron headers (already implemented).

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Set up a monthly cron job to call:

   ```
   POST https://yourdomain.com/api/usage/reset
   Headers:
     Authorization: Bearer your-secret-key
     Content-Type: application/json
   ```

2. Schedule: `0 0 1 * *` (runs at midnight on the 1st of every month)

### Option 3: Server Cron (if self-hosting)

1. Add to your server's crontab:
   ```bash
   0 0 1 * * curl -X POST -H "Authorization: Bearer your-secret-key" https://yourdomain.com/api/usage/reset
   ```

## Environment Variables Required

Add to your `.env.local` or deployment environment:

```env
CRON_SECRET=your-very-secure-secret-key-here
```

## Testing

You can test the endpoint manually:

```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  https://yourdomain.com/api/usage/reset
```

## What It Does

1. Resets `questions_used` to 0 for all users for the current month
2. Creates new usage tracking records if they don't exist
3. Cleans up usage records older than 12 months
4. Returns statistics about the reset operation

## Monitoring

The endpoint returns detailed information about the reset operation:

- Number of users processed
- Number of successful resets
- Number of errors
- Current month being reset

Monitor your logs to ensure the cron job runs successfully each month.

## Security Notes

- Keep your `CRON_SECRET` secure and rotate it periodically
- Consider adding IP whitelist restrictions for additional security
- Monitor for failed reset attempts in your logs
