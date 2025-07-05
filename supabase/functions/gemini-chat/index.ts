
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  context?: string;
  skill?: string;
  generateContent?: boolean;
}

// Topic pools for different skills
const TOPICS = {
  listening: [
    "Environmental Conservation and Climate Change",
    "Technology and Social Media Impact",
    "Education Systems Around the World",
    "Healthcare and Medical Advances",
    "Urban Planning and City Development",
    "Cultural Diversity and Traditions",
    "Space Exploration and Scientific Discovery",
    "Renewable Energy and Sustainability",
    "Food Security and Agriculture",
    "Transportation and Future Mobility"
  ],
  reading: [
    "The Rise of Artificial Intelligence in Healthcare",
    "Sustainable Tourism and Its Environmental Impact",
    "The Psychology of Decision Making",
    "Ancient Civilizations and Modern Architecture",
    "Ocean Conservation and Marine Biology",
    "The Future of Work and Remote Employment",
    "Genetic Engineering and Ethical Considerations",
    "Urban Wildlife and Ecosystem Balance",
    "The History and Evolution of Language",
    "Renewable Energy Technologies and Innovation"
  ],
  writing: [
    "Should governments invest more in public transportation than private car infrastructure?",
    "Do the benefits of social media outweigh its negative impacts on society?",
    "Is it better to live in a small town or a big city?",
    "Should university education be free for all students?",
    "Do people today have healthier lifestyles than previous generations?",
    "Should companies be required to hire equal numbers of men and women?",
    "Is online learning as effective as traditional classroom education?",
    "Should governments spend more money on space exploration or solving earthly problems?",
    "Do the advantages of globalization outweigh the disadvantages?",
    "Should plastic bags be banned completely?"
  ],
  speaking: [
    "Describe a time when you helped someone. How did it make you feel?",
    "Talk about a skill you would like to learn. Why is it important to you?",
    "Describe a place you visited that was different from your hometown.",
    "Discuss a book or movie that influenced your thinking.",
    "Talk about a traditional celebration in your country.",
    "Describe a time when you had to overcome a challenge.",
    "Discuss the importance of friendship in your life.",
    "Talk about a hobby or activity you enjoy in your free time.",
    "Describe your ideal job and explain why it appeals to you.",
    "Discuss how technology has changed communication."
  ]
};

const getRandomTopic = (skill: string): string => {
  const topics = TOPICS[skill as keyof typeof TOPICS] || TOPICS.reading;
  return topics[Math.floor(Math.random() * topics.length)];
};

const generateSkillContent = (skill: string, topic: string) => {
  switch (skill) {
    case 'listening':
      return `Create an IELTS Listening test about "${topic}". Include:
        - A realistic conversation or monologue (200-300 words)
        - 10 questions (mix of multiple choice, gap filling, and matching)
        - Questions should test various listening skills
        - Use authentic language and scenarios
        Format as JSON with 'audio_script' and 'questions' fields.`;
        
    case 'reading':
      return `Create an IELTS Reading passage about "${topic}". Include:
        - An academic-style passage (400-500 words) with clear paragraph structure
        - 10 questions: 8 True/False/Not Given + 2 summary completion
        - Questions should test reading comprehension skills
        - Use formal, academic language
        Format as JSON with 'passage' and 'questions' fields.`;
        
    case 'writing':
      return `Create an IELTS Writing Task 2 question about "${topic}". Include:
        - A clear, balanced question that allows for argumentation
        - Context and instructions for a 250+ word essay
        - Specific guidance on what aspects to address
        Format as JSON with 'question', 'instructions', and 'key_points' fields.`;
        
    case 'speaking':
      return `Create an IELTS Speaking Part 2 task about "${topic}". Include:
        - A clear cue card with the main topic
        - 3-4 specific points to address
        - Time allocation (1 minute prep, 2 minutes speaking)
        - Follow-up questions for Part 3
        Format as JSON with 'cue_card', 'points', and 'followup_questions' fields.`;
        
    default:
      return `Provide IELTS preparation guidance about "${topic}".`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, skill, generateContent }: ChatRequest = await req.json();

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let prompt = message;

    // If generating content for a specific skill, use a random topic
    if (generateContent && skill) {
      const randomTopic = getRandomTopic(skill);
      prompt = generateSkillContent(skill, randomTopic);
      console.log(`Generating ${skill} content with topic: ${randomTopic}`);
    }

    const fullPrompt = context 
      ? `Context: ${context}\n\nUser request: ${prompt}\n\nPlease provide a helpful response for IELTS preparation. If providing feedback, structure it professionally with clear sections for band scores, strengths, areas for improvement, and recommendations. Avoid using asterisks for formatting.`
      : `As an IELTS preparation assistant, please help with: ${prompt}. If providing feedback, structure it professionally with clear sections for band scores, strengths, areas for improvement, and recommendations. Avoid using asterisks for formatting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received successfully');

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return new Response(JSON.stringify({ 
      response: generatedText,
      success: true,
      topic: generateContent && skill ? getRandomTopic(skill) : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
