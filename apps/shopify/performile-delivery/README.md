# Performile Delivery Ratings - Shopify App

Show verified courier ratings directly in your Shopify checkout to increase customer trust and conversions.

## Features

- **Verified Ratings**: Display courier ratings based on real customer reviews
- **Location-Based**: Show top couriers for customer's postal code
- **Checkout Integration**: Seamlessly integrated into Shopify checkout
- **Real-Time Updates**: Ratings update as customer enters shipping address
- **Mobile Responsive**: Works perfectly on all devices
- **Customizable**: Configure title and number of couriers to display

## What Customers See

- Courier name and logo
- Star rating (1-5 stars)
- Number of verified reviews
- Average delivery time
- On-time delivery percentage
- Trust badges (Excellent, Very Good, Good)

## Installation

### Prerequisites

- Shopify Partner account
- Node.js 18+ installed
- Shopify CLI installed (`npm install -g @shopify/cli`)
- Performile account and API key

### Setup Steps

1. **Clone the repository**
```bash
cd apps/shopify/performile-delivery
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Connect to Shopify**
```bash
npm run config:link
```

4. **Start development server**
```bash
npm run dev
```

5. **Install on your store**
- Follow the CLI prompts to install on your development store
- Configure the app settings
- Enable the checkout UI extension

## Configuration

### App Settings

Configure in your Shopify admin:

- **Enable/Disable**: Turn courier ratings on/off
- **Section Title**: Customize the heading text
- **Number of Couriers**: Show 1-5 top-rated couriers
- **API Key**: Your Performile API key

### Checkout UI Extension

The extension automatically:
- Fetches courier ratings when customer enters postal code
- Displays top-rated couriers with ratings and stats
- Saves selected courier to order attributes
- Updates in real-time as address changes

## How It Works

1. Customer enters shipping address in checkout
2. Extension fetches top couriers for that postal code from Performile API
3. Ratings are displayed with trust score, reviews, and delivery stats
4. Customer can see courier performance before completing purchase
5. Selected courier is saved to order attributes

## API Integration

The app connects to Performile's API:

**Endpoint**: `https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal`

**Parameters**:
- `postal_code`: Customer's postal/zip code
- `limit`: Number of couriers to return (default: 3)

**Response**:
```json
{
  "success": true,
  "postal_code": "12345",
  "couriers": [
    {
      "courier_id": "uuid",
      "courier_name": "DHL Express",
      "trust_score": 4.8,
      "total_reviews": 234,
      "avg_delivery_time": "1-2 days",
      "on_time_percentage": 95,
      "badge": "excellent"
    }
  ]
}
```

## Order Attributes

Selected courier is saved to order with these attributes:

- `performile_courier_id`: UUID of selected courier
- `performile_courier_name`: Name of selected courier

Access in order details or use in fulfillment logic.

## Development

### Project Structure

```
performile-delivery/
├── index.js                 # Main server file
├── package.json            # Dependencies
├── shopify.app.toml        # App configuration
├── extensions/
│   └── checkout-ui/
│       ├── shopify.extension.toml
│       └── src/
│           └── Checkout.jsx  # React component
└── README.md
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Shopify
- `npm run info` - Show app info

### Testing

1. Install app on development store
2. Create a test order
3. Enter shipping address with postal code
4. Verify courier ratings appear
5. Complete checkout
6. Check order attributes for saved courier

## Deployment

### Deploy to Production

1. **Update configuration**
```bash
# Update shopify.app.toml with production URLs
```

2. **Build the app**
```bash
npm run build
```

3. **Deploy to Shopify**
```bash
npm run deploy
```

4. **Submit for review**
- Go to Shopify Partners dashboard
- Submit app for review
- Wait for approval

### Hosting Options

- **Shopify Hosting**: Use Shopify's built-in hosting (recommended)
- **Vercel**: Deploy Express server to Vercel
- **Heroku**: Deploy to Heroku
- **AWS**: Deploy to AWS Lambda or EC2

## Customization

### Styling

The checkout UI extension uses Shopify's design system. Customize appearance through:

1. **Extension settings** (shopify.extension.toml)
2. **Component props** (Checkout.jsx)
3. **Shopify theme settings**

### Advanced Features

To add custom features:

1. Modify `Checkout.jsx` component
2. Add new API endpoints in `index.js`
3. Update extension configuration
4. Redeploy the app

## Troubleshooting

### Ratings not showing

- Check postal code is valid
- Verify API key is correct
- Check network requests in browser console
- Ensure extension is enabled in checkout settings

### Authentication errors

- Verify API credentials in .env
- Check OAuth redirect URLs
- Ensure app is installed on store

### Extension not loading

- Check Shopify CLI version
- Rebuild extension: `npm run build`
- Clear browser cache
- Check extension is activated in checkout settings

## Support

- **Documentation**: https://performile.com/docs/shopify
- **Support**: https://performile.com/support
- **Issues**: https://github.com/performile/shopify-app/issues

## Privacy & Security

- Only postal code is sent to Performile API
- No personal customer data is shared
- All API calls are encrypted (HTTPS)
- Compliant with Shopify's privacy requirements

See [Privacy Policy](https://performile.com/privacy) for details.

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge)
- [Shopify Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Performile API](https://performile.com)

---

**Made with ❤️ by Performile**
