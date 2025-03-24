# LangGraph Restaurant Table Booking System

A conversational AI system for booking restaurant tables, built with LangGraph, LangChain, FastAPI, and Next.js.

## Features

- AI-powered conversational agent for natural language table bookings
- Real-time streaming of agent's reasoning and tool executions
- Multiple restaurant management features:
  - Check table availability
  - Book tables
  - Join waiting lists 
  - Get current date/time information

## Architecture

The application is structured as a monorepo with separate frontend and backend components:

### Backend

- **Framework**: FastAPI
- **Agent Technology**: LangGraph with ReAct architecture
- **Language Model**: OpenAI integration
- **Agent Tools**:
  - `current_time`: Get current date and time
  - `get_table_availability`: Check if tables are available
  - `save_booking`: Book a table
  - `join_waiting_list`: Join restaurant waiting list

### Frontend

- **Framework**: Next.js 
- **UI Library**: React with Tailwind CSS and Radix UI components
- **Features**:
  - Real-time chat interface
  - Markdown support for formatted messages
  - Collapsible tool execution details
  - Live typing indicators

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your configuration:
   ```
   cp .env.example .env
   ```
   Edit the file to add your OpenAI API key and other settings.

5. Start the server:
   ```
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   pnpm install
   ```

3. Create a `.env.local` file with backend configuration:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_BACKEND_API_KEY=your_api_key
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Type your question or booking request in the chat interface
2. The AI agent will respond and may use tools to help fulfill your request
3. You can view the agent's reasoning process by expanding the tool execution details

Example requests:
- "I'd like to book a table at Luigi's Restaurant tonight at 7pm for 4 people"
- "Check if The Golden Fork has any tables available this Saturday"
- "Add me to the waiting list at Sakura Sushi for tomorrow at noon"

## Project Structure

```
langgraph-table-booking/
├── backend/                 # FastAPI backend
│   ├── requirements.txt     # Python dependencies
│   ├── run.py               # Server entry point
│   └── src/                 # Source code
│       ├── config.py        # Configuration settings
│       ├── main.py          # FastAPI app setup
│       ├── models/          # Data models
│       ├── routes/          # API endpoints
│       ├── tools/           # LangGraph agent tools
│       └── utils/           # Helper functions
├── frontend/                # Next.js frontend
│   ├── package.json         # Node dependencies
│   ├── public/              # Static assets
│   └── src/                 # Source code
│       ├── app/             # Next.js app router
│       ├── components/      # UI components
│       └── lib/             # Utilities
└── README.md                # Project documentation
```

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [LangGraph](https://github.com/langchain-ai/langgraph)
- UI components from [Radix UI](https://www.radix-ui.com/) 
- Styling with [Tailwind CSS](https://tailwindcss.com/)