
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

// Enhanced topic pools for different skills
const TOPICS = {
  listening: [
    "University course enrollment and academic registration process",
    "Technology company job interview and workplace dynamics", 
    "Apartment rental inquiry and housing market discussion",
    "Library services and digital resource management",
    "International travel booking and tourism experiences",
    "Restaurant reservation and culinary culture exploration",
    "Medical appointment scheduling and healthcare systems",
    "Banking services and financial planning consultation",
    "Fitness center membership and wellness program discussion",
    "E-commerce customer service and online shopping trends",
    "Academic conference registration and professional networking",
    "Hotel accommodation and hospitality service standards",
    "Public transportation systems and urban mobility solutions",
    "Insurance policy consultation and risk management",
    "Career counseling and professional development planning"
  ],
  reading: [
    "Climate Change Mitigation and Renewable Energy Innovation",
    "Artificial Intelligence Applications in Modern Healthcare",
    "Smart City Development and Sustainable Urban Planning", 
    "Digital Psychology and Social Media's Impact on Behavior",
    "Biodiversity Conservation and Ecosystem Restoration",
    "Future of Work: Remote Employment and Digital Nomadism",
    "Mars Colonization and Advanced Space Exploration",
    "Precision Agriculture and Global Food Security",
    "Cybersecurity and Digital Privacy Rights Protection",
    "Electric Vehicle Revolution and Transportation Evolution",
    "Mental Health Awareness and Community Support Systems",
    "Ocean Conservation and Marine Ecosystem Protection",
    "Archaeological Innovation and Ancient Civilization Studies",
    "Educational Technology and Personalized Learning Systems",
    "Genetic Engineering Ethics and Biotechnology Advancement"
  ],
  writing: [
    "Should governments prioritize environmental sustainability over immediate economic growth in developing nations?",
    "Do the advantages of artificial intelligence in education outweigh the risks to traditional learning methods?",
    "Has social media fundamentally improved or damaged human communication and relationship building?",
    "Should automation and AI replace human workers in manufacturing and service industries?",
    "Is urban living more beneficial for personal development than rural lifestyle choices?",
    "Should public transportation be completely free and government-funded in all major cities?",
    "Do the convenience benefits of fast food culture justify its impact on public health?",
    "How effectively can globalization preserve local cultures while promoting international cooperation?",
    "Should space exploration receive more government funding than poverty alleviation programs?",
    "Is maintaining work-life balance more challenging now than for previous generations?",
    "Do the medical benefits of AI diagnostics outweigh patient privacy concerns?",
    "Should wealthy nations focus on climate solutions or economic aid to developing countries?"
  ],
  speaking: [
    "Describe a childhood memory that significantly influenced your personality and life choices",
    "Talk about a dream destination you want to visit and explain what makes it special",
    "Describe a skill you wish to master and how it would impact your future",
    "Discuss a book, movie, or documentary that changed your perspective on life",
    "Describe a piece of technology that has revolutionized your daily routine",
    "Talk about someone who inspires you and the qualities you admire in them",
    "Describe a cultural festival or tradition that holds special meaning in your community",
    "Discuss a hobby or creative activity that brings you joy and fulfillment",
    "Describe a significant challenge you overcame and the lessons you learned",
    "Talk about your ideal vacation and the experiences you hope to have",
    "Describe a memorable dining experience and what made it so special",
    "Discuss a work of art, music, or literature that deeply resonates with you"
  ]
};

const getRandomTopic = (skill: string): string => {
  const topics = TOPICS[skill as keyof typeof TOPICS] || TOPICS.reading;
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
};

const generateSkillContent = (skill: string, topic: string) => {
  switch (skill) {
    case 'listening':
      return `Create a comprehensive IELTS Listening test about "${topic}". Generate:
        - A realistic conversation or monologue transcript (500-600 words) with natural, engaging dialogue
        - Exactly 10 varied questions: 4 multiple choice (A,B,C,D), 4 fill-in-the-blank, 2 matching/labeling
        - Include specific details, names, dates, numbers, and realistic scenarios in the conversation
        - Questions should test various listening skills: main ideas, specific information, attitudes, and inferences
        - Provide clear answer key with brief explanations for each answer
        - Make the content educational and relevant to real-life situations
        Format as valid JSON with 'transcript', 'questions', 'answers', and 'explanations' fields.`;
        
    case 'reading':
      return `Create a comprehensive IELTS Reading passage about "${topic}". Generate:
        - An academic-style passage (700-800 words) with 5 clear, well-developed paragraphs (A, B, C, D, E)
        - Use sophisticated vocabulary, complex sentence structures, and academic tone
        - Exactly 10 questions total: 6 True/False/Not Given, 2 multiple choice, 2 summary completion
        - Questions should test reading comprehension, inference, detail recognition, and critical thinking
        - Include challenging distractors and academic language appropriate for IELTS level
        - Provide detailed explanations for each answer with reference to specific parts of the text
        Format as valid JSON with 'passage', 'questions', 'answers', and 'explanations' fields.`;
        
    case 'writing':
      return `Create comprehensive IELTS Writing tasks about "${topic}". Generate:
        - Task 1: A data visualization task (chart/graph/table) with clear, specific description requirements
        - Task 2: An argumentative essay question with balanced perspectives and clear position requirement
        - Include specific word count requirements (150+ for Task 1, 250+ for Task 2)
        - Provide detailed assessment criteria and band score descriptors for each task
        - Include sample response excerpts for different band levels (6.0, 7.0, 8.0)
        - Give specific tips for achieving higher band scores
        Format as valid JSON with 'task1', 'task2', 'criteria', 'band_descriptors', and 'sample_responses' fields.`;
        
    case 'speaking':
      return `Create a complete IELTS Speaking test about "${topic}". Generate:
        - Part 1: 4 personal questions about daily life and experiences related to the topic
        - Part 2: Detailed cue card with "${topic}" as main focus and 4 specific, engaging bullet points
        - Part 3: 4 abstract discussion questions for deeper analysis, comparison, and critical thinking
        - Include precise timing guidelines (4-5 min Part 1, 3-4 min Part 2, 4-5 min Part 3)
        - Provide comprehensive assessment criteria for fluency, vocabulary, grammar, and pronunciation
        - Include sample response frameworks and improvement tips for each part
        Format as valid JSON with 'part1', 'part2', 'part3', 'assessment_criteria', and 'sample_frameworks' fields.`;
        
    default:
      return `Generate comprehensive IELTS ${skill} test content about "${topic}" with proper structure, detailed questions, and thorough assessment criteria.`;
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
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    let prompt = message;
    let selectedTopic = '';

    // If generating content for a specific skill, use a random topic
    if (generateContent && skill) {
      selectedTopic = getRandomTopic(skill);
      prompt = generateSkillContent(skill, selectedTopic);
      console.log(`Generating ${skill} content with topic: ${selectedTopic}`);
    }

    const fullPrompt = context 
      ? `Context: ${context}\n\nUser request: ${prompt}\n\nPlease provide a helpful, detailed response for IELTS preparation. If providing feedback, structure it professionally with clear sections for scores, strengths, areas for improvement, and specific recommendations. Use professional language without asterisks or markdown formatting. Ensure all content is educationally valuable and practically applicable.`
      : `As an expert IELTS preparation assistant and certified examiner, please help with: ${prompt}. If providing feedback, structure it professionally with clear sections for band scores, strengths, areas for improvement, and actionable recommendations. Use professional language without asterisks or markdown formatting. Focus on providing educational value and practical guidance for IELTS success.`;

    console.log('Making request to Gemini API...');

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
          maxOutputTokens: 4000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",  
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');

    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in Gemini response:', data);
      throw new Error('No response generated from Gemini API');
    }

    const generatedText = data.candidates[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text content in Gemini response:', data);
      throw new Error('No text content generated from Gemini API');
    }

    console.log('Successfully generated high-quality response');

    return new Response(JSON.stringify({ 
      response: generatedText,
      success: true,
      topic: selectedTopic || undefined,
      skill: skill || undefined,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in gemini-chat function:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred while processing your request';
    let errorDetails = error.message;
    
    if (error.message.includes('API key')) {
      errorMessage = 'API key configuration error - please contact support';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network connection error - please try again';
    } else if (error.message.includes('Gemini API')) {
      errorMessage = 'AI service temporarily unavailable - please try again shortly';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Service temporarily busy - please wait a moment and try again';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
