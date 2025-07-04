# 🎌 Ani-CLI Web

A modern web interface for watching anime, built as a web version of the popular [ani-cli](https://github.com/pystardust/ani-cli) tool. Stream anime directly in your browser with a clean, responsive interface.

![Ani-CLI Web Interface](https://via.placeholder.com/800x400?text=Ani-CLI+Web+Interface)

## ✨ Features

- 🔍 **Smart Search**: Search anime by title with real-time results
- 🎭 **Dual Audio Support**: Choose between subtitled (SUB) and dubbed (DUB) versions
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎬 **Integrated Player**: Built-in HTML5 video player with subtitle support
- 🚀 **Fast Loading**: Optimized for quick episode loading and playback
- 🌐 **No Installation Required**: Just open in your browser and start watching

## 🚀 Quick Start

### Option 1: Use GitHub Pages (Recommended)

1. **Fork this repository** to your GitHub account
2. **Deploy your Cloudflare Worker** (see instructions below)
3. **Update the API proxy URL** in `index.html`:
   ```javascript
   const API_PROXY = 'https://your-worker.your-subdomain.workers.dev';
   ```
4. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch" → "main" → "/ (root)"
   - Your site will be available at `https://yourusername.github.io/ani-cli-web`

### Option 2: Self-Host

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ani-cli-web.git
   cd ani-cli-web
   ```

2. **Deploy Cloudflare Worker** (see instructions below)

3. **Update API proxy URL** in `index.html`

4. **Serve the files**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

5. **Open** `http://localhost:8000` in your browser

## ☁️ Cloudflare Workers Setup

The Cloudflare Worker acts as a CORS proxy and implements the video source fetching logic from ani-cli.

### Prerequisites

- A Cloudflare account (free tier works)
- Node.js installed on your machine
- Wrangler CLI tool

### Step-by-Step Deployment

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Deploy the Worker**:
   ```bash
   # From the project directory
   wrangler publish
   ```

4. **Copy your Worker URL**:
   After deployment, you'll see something like:
   ```
   Published ani-cli-web-proxy (1.0)
   https://ani-cli-web-proxy.your-subdomain.workers.dev
   ```

5. **Update `index.html`**:
   Replace the API_PROXY constant with your Worker URL:
   ```javascript
   const API_PROXY = 'https://ani-cli-web-proxy.your-subdomain.workers.dev';
   ```

### Alternative: One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/ani-cli-web)

## 🛠️ Configuration

### Custom Worker Domain (Optional)

For a cleaner URL, you can set up a custom domain:

1. **Add a custom domain** in Cloudflare Workers dashboard
2. **Update the API_PROXY** in `index.html` to use your custom domain
3. **Configure DNS** if using your own domain

### Environment Variables

You can customize the worker behavior by setting these variables in `wrangler.toml`:

```toml
[vars]
ALLANIME_API = "https://api.allanime.to"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

## 🔧 Development

### Local Development

1. **Start the Worker locally**:
   ```bash
   wrangler dev
   ```
   This starts the worker at `http://localhost:8787`

2. **Update API_PROXY** in `index.html` for local development:
   ```javascript
   const API_PROXY = 'http://localhost:8787';
   ```

3. **Serve the frontend**:
   ```bash
   python -m http.server 8000
   ```

### Project Structure

```
ani-cli-web/
├── index.html          # Main web interface
├── worker.js           # Cloudflare Worker (CORS proxy + video fetching)
├── wrangler.toml       # Worker configuration
├── README.md           # This file
└── LICENSE             # License file
```

### How It Works

1. **Search**: User searches for anime → Request sent to Worker → Worker proxies to AllAnime API
2. **Episode Selection**: User selects episode → Worker fetches source URLs and decodes them
3. **Video Sources**: Worker processes different providers (wixmp, youtube, sharepoint, hianime)
4. **Playback**: Direct video URL returned to frontend → HTML5 player plays the video

## 🌐 Deployment Options

### GitHub Pages + Cloudflare Workers
- **Frontend**: GitHub Pages (free)
- **Backend**: Cloudflare Workers (free tier: 100k requests/day)
- **Domain**: `yourusername.github.io/ani-cli-web`

### Raspberry Pi + Cloudflare Workers
- **Frontend**: Nginx/Apache on Pi
- **Backend**: Cloudflare Workers
- **Domain**: Your home network or dynamic DNS

### Vercel + Cloudflare Workers
- **Frontend**: Vercel (free)
- **Backend**: Cloudflare Workers
- **Domain**: Custom domain supported

### Netlify + Cloudflare Workers
- **Frontend**: Netlify (free)
- **Backend**: Cloudflare Workers
- **Domain**: Custom domain supported

## 🚨 Important Notes

### Legal Disclaimer
This project is for educational purposes only. Users are responsible for complying with their local laws and the terms of service of content providers. The developers do not host, store, or distribute any copyrighted content.

### Rate Limiting
The free Cloudflare Workers tier includes:
- 100,000 requests per day
- 10ms CPU time per request
- 128MB memory

For heavy usage, consider upgrading to the paid tier.

### CORS Issues
If you encounter CORS errors:
1. Make sure your Cloudflare Worker is deployed and accessible
2. Verify the API_PROXY URL in `index.html` is correct
3. Check browser console for specific error messages

## 🔍 Troubleshooting

### "No results found" Error
- Check if your Worker is deployed and running
- Verify the API_PROXY URL is correct
- Check browser network tab for failed requests

### Video Won't Play
- Some video sources may not work in all browsers
- Try a different browser (Chrome/Firefox recommended)
- Check if the video URL is accessible directly

### Worker Deployment Issues
```bash
# Check your account ID
wrangler whoami

# Verify wrangler.toml configuration
wrangler preview

# Check worker logs
wrangler tail
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines
- Keep the interface simple and fast
- Ensure mobile responsiveness
- Test on multiple browsers
- Follow existing code style
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ani-cli](https://github.com/pystardust/ani-cli) - The original CLI tool that inspired this project
- [AllAnime](https://allanime.to) - Anime content source
- [Cloudflare Workers](https://workers.cloudflare.com) - Serverless platform for the proxy

## 🐛 Known Issues

- Some video sources may not work in Safari
- M3U8 streams require modern browser support
- Rate limiting may occur with heavy usage

## 🔄 Updates

To update your deployment:

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Redeploy Worker**:
   ```bash
   wrangler publish
   ```

3. **Clear browser cache** for the frontend

---

**⭐ Star this repository if you find it useful!**

For support, please open an issue or join our [Discord community](https://discord.gg/your-invite-link).