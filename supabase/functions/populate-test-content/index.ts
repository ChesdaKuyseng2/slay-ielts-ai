
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { skillType, count = 5 } = await req.json();

    if (!skillType) {
      throw new Error('skillType is required');
    }

    console.log(`Generating ${count} pre-generated tests for ${skillType}`);

    const generatedTests = [];
    const skills = skillType === 'all' ? ['listening', 'reading', 'writing', 'speaking'] : [skillType];

    for (const skill of skills) {
      for (let i = 0; i < count; i++) {
        try {
          // Call Gemini to generate test content
          const { data: geminiResponse, error: geminiError } = await supabaseClient.functions.invoke('gemini-chat', {
            body: {
              message: `Generate a comprehensive IELTS ${skill} test with detailed questions and realistic content`,
              skill: skill,
              generateContent: true
            }
          });

          if (geminiError) {
            console.error(`Error generating content for ${skill}:`, geminiError);
            continue;
          }

          let testContent;
          let topic = `AI Generated ${skill} Test ${i + 1}`;

          try {
            testContent = JSON.parse(geminiResponse.response);
            topic = geminiResponse.topic || topic;
          } catch {
            // If parsing fails, create structured content from text
            testContent = createStructuredContent(geminiResponse.response, skill);
          }

          // Store in database
          const { data: storedTest, error: storeError } = await supabaseClient
            .from('ai_generated_tests')
            .insert({
              skill_type: skill,
              content: testContent,
              topic: topic,
              difficulty_level: 'intermediate'
            })
            .select()
            .single();

          if (storeError) {
            console.error(`Error storing test for ${skill}:`, storeError);
            continue;
          }

          generatedTests.push({
            id: storedTest.id,
            skill_type: skill,
            topic: topic
          });

          console.log(`Successfully generated and stored ${skill} test ${i + 1}`);

        } catch (error) {
          console.error(`Error in test generation loop for ${skill}:`, error);
          continue;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${generatedTests.length} tests`,
      tests: generatedTests
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in populate-test-content function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createStructuredContent(textContent: string, skill: string) {
  const baseContent = {
    title: `AI Generated ${skill.charAt(0).toUpperCase() + skill.slice(1)} Test`,
    description: textContent.substring(0, 200) + '...',
    instructions: `Complete this ${skill} test to the best of your ability.`
  };

  switch (skill) {
    case 'listening':
      return {
        ...baseContent,
        transcript: textContent,
        questions: generateFallbackQuestions(skill, 10),
        section: 1
      };
    case 'reading':
      return {
        ...baseContent,
        passage: textContent,
        questions: generateFallbackQuestions(skill, 10)
      };
    case 'writing':
      return {
        ...baseContent,
        task1: {
          prompt: "Describe the chart/graph/table shown below. Summarize the information and make comparisons where relevant.",
          type: "data_description"
        },
        task2: {
          prompt: textContent.length > 100 ? textContent : "Some people believe technology has made our lives easier, while others think it has made life more complicated. Discuss both views and give your opinion.",
          type: "argumentative_essay"
        }
      };
    case 'speaking':
      return {
        ...baseContent,
        part1: [
          "Tell me about your hometown.",
          "What do you like to do in your free time?",
          "How do you usually spend your weekends?",
          "What are your future plans?"
        ],
        part2: {
          topic: "Describe a memorable experience",
          cue_card: "You should say: What the experience was, When it happened, Who was involved, Why it was memorable",
          preparation_time: 60,
          speaking_time: 120
        },
        part3: [
          "How do you think technology will change in the future?",
          "What role does education play in society?",
          "How important is it to preserve cultural traditions?",
          "What are the benefits and drawbacks of globalization?"
        ]
      };
    default:
      return baseContent;
  }
}

function generateFallbackQuestions(skill: string, count: number) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    if (skill === 'listening' || skill === 'reading') {
      questions.push({
        id: i,
        type: i % 3 === 0 ? 'fill_blank' : 'multiple_choice',
        question: `Question ${i}: What is the main point discussed in this section?`,
        options: i % 3 !== 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
        correctAnswer: i % 3 !== 0 ? 'Option A' : 'answer'
      });
    }
  }
  return questions;
}
