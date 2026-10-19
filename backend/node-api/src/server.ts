import { createApp } from './app.js';

const PORT = process.env.NODE_API_PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[SalesInsight Node Gateway API] Running on http://localhost:${PORT}`);
});
