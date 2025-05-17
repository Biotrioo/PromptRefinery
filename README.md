# PromptRefinery

PromptRefinery is a Next.js-based web application for creating, editing, organizing, and previewing AI prompts. Designed for developers and AI practitioners, it offers a clean interface for managing prompt workflows.

## ✨ Features

- ⚡ Live prompt preview and formatting
- 🧠 Prompt critique API endpoints
- 🗂 Prompt vault for version tracking
- 🛡 Hydration guard for smoother SSR/CSR transitions
- 🧪 Unit tests with Jest (example: `PromptEditor.test.tsx`)

## 📦 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Icons**: Custom SVGs
- **API Routes**: Built-in with Next.js

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Biotrioo/PromptRefinery.git
cd PromptRefinery

2. Install dependencies

npm install
# or
yarn install

3. Run the development server

npm run dev
# or
yarn dev

Visit http://localhost:3000 to see the app.
🧪 Running Tests

npm test
# or
yarn test

📁 Folder Structure

src/
  app/
    api/              # Backend API routes
    layout.tsx        # Global layout
    page.tsx          # Landing page
  components/         # UI components
  app/globals.css     # Global styles

public/               # Static assets

🛠 Configuration

    Edit next.config.ts to customize Next.js behavior.

    Environment variables (not committed) should be added to .env.local.

Example:

OPENAI_API_KEY=your-key-here

📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
🙌 Acknowledgments

    Inspired by tools like PromptLayer

    Developed by @Biotrioo

🗨 Feedback

Feel free to open issues or pull requests. Contributions are welcome!
