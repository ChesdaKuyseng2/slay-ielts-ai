
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
    // Use service role key for admin operations
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
          let testContent;
          let topic = `Pre-generated ${skill} Test ${i + 1}`;

          // Try to call Gemini to generate test content
          try {
            const { data: geminiResponse, error: geminiError } = await supabaseClient.functions.invoke('gemini-chat', {
              body: {
                message: `Generate a comprehensive IELTS ${skill} test with detailed questions and realistic content. Format the response as valid JSON.`,
                skill: skill,
                generateContent: true
              }
            });

            if (!geminiError && geminiResponse?.response) {
              try {
                testContent = JSON.parse(geminiResponse.response);
                topic = geminiResponse.topic || topic;
              } catch {
                // If parsing fails, create structured content from text
                testContent = createStructuredContent(geminiResponse.response, skill);
              }
            } else {
              throw new Error('Gemini API failed');
            }
          } catch (apiError) {
            console.warn(`Gemini API failed for ${skill}, using fallback:`, apiError);
            // Use fallback content if API fails
            testContent = createFallbackContent(skill, i + 1);
          }

          // Store in database with service role permissions
          const { data: storedTest, error: storeError } = await supabaseClient
            .from('ai_generated_tests')
            .insert({
              skill_type: skill,
              content: testContent,
              topic: topic,
              difficulty_level: 'intermediate',
              is_active: true
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

function createFallbackContent(skill: string, testNumber: number) {
  const fallbackContent = {
    listening: {
      title: `University Campus Tour - Test ${testNumber}`,
      transcript: "Welcome to our university campus tour. I'm David, your guide today. Our campus covers 200 acres and houses approximately 15,000 students. Let me start by showing you our main facilities. The library, our central hub, is open 24/7 during exam periods and until 11 PM on regular days. It has six floors, with silent study areas on floors 4-6 and group study rooms on floors 1-3. The sports complex includes a swimming pool, gymnasium, and tennis courts. Students can access these facilities for free with their student ID. The student union building contains the cafeteria, bookstore, and various club meeting rooms. Classes are held in four main academic buildings: Science Block, Arts Block, Engineering Block, and Business School. Each building has its own computer lab and lecture halls. Parking is available in three lots, but students need to purchase a parking permit at the beginning of each semester.",
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "How many students study at this university?",
          options: ["12,000", "15,000", "18,000", "20,000"],
          correctAnswer: "15,000"
        },
        {
          id: 2,
          type: "fill_blank",
          question: "The library is open ________ during exam periods.",
          correctAnswer: "24/7"
        },
        {
          id: 3,
          type: "multiple_choice",
          question: "Which floors have silent study areas?",
          options: ["Floors 1-3", "Floors 4-6", "All floors", "Ground floor only"],
          correctAnswer: "Floors 4-6"
        }
      ]
    },
    reading: {
      title: `Climate Change and Renewable Energy - Test ${testNumber}`,
      passage: "The transition to renewable energy sources has become one of the most critical challenges of our time. As global temperatures continue to rise and fossil fuel reserves dwindle, governments and corporations worldwide are investing heavily in sustainable alternatives. Solar power technology has advanced significantly in recent years. Modern photovoltaic cells can now convert sunlight to electricity at efficiency rates exceeding 20%, compared to just 6% in the 1970s. Wind energy has also seen remarkable growth, with offshore wind farms becoming increasingly common. These installations can generate power more consistently than their onshore counterparts due to stronger and more reliable wind patterns over the ocean. Hydroelectric power remains the most established renewable source, providing approximately 16% of the world's electricity. However, environmental concerns about dam construction have led to increased focus on small-scale hydro projects that have minimal ecological impact. Energy storage technology is crucial for renewable energy adoption. Battery systems, particularly lithium-ion batteries, have become more efficient and affordable. Smart grid technology allows for better distribution and management of renewable energy, automatically balancing supply and demand across different regions.",
      questions: [
        {
          id: 1,
          type: "true_false_not_given",
          question: "Modern solar cells are over three times more efficient than those from the 1970s.",
          correctAnswer: "True"
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "What percentage of world electricity does hydroelectric power provide?",
          options: ["12%", "16%", "20%", "25%"],
          correctAnswer: "16%"
        },
        {
          id: 3,
          type: "true_false_not_given",
          question: "Offshore wind farms are less reliable than onshore installations.",
          correctAnswer: "False"
        }
      ]
    },
    writing: {
      title: `Education and Technology - Test ${testNumber}`,
      task1: {
        prompt: "The chart below shows the percentage of students using different types of technology for learning in three countries in 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
        type: "data_description",
        wordCount: 150
      },
      task2: {
        prompt: "In many countries, traditional forms of education are being replaced by online learning platforms. Some people believe this is a positive development, while others think it has negative consequences. Discuss both views and give your own opinion.",
        type: "argumentative_essay",
        wordCount: 250
      }
    },
    speaking: {
      title: `Travel and Culture - Test ${testNumber}`,
      part1: [
        "Do you enjoy traveling? Why or why not?",
        "What is your favorite destination you have visited?",
        "How do you usually plan your trips?",
        "What kind of accommodation do you prefer when traveling?"
      ],
      part2: {
        topic: "Describe a cultural event you attended",
        cue_card: "You should say:\n- What the event was\n- Where and when it took place\n- Who you went with\n- And explain why this event was memorable for you",
        preparation_time: 60,
        speaking_time: 120
      },
      part3: [
        "How important is it to preserve cultural traditions?",
        "Do you think globalization is affecting local cultures?",
        "What can governments do to promote their cultural heritage?",
        "How has technology changed the way we experience culture?"
      ]
    }
  };

  return fallbackContent[skill as keyof typeof fallbackContent];
}

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
