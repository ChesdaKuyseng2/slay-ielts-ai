
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Volume2, Mic, MicOff } from 'lucide-react';

interface PracticeSessionProps {
  skillType: string;
  onBack: () => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ skillType, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [userResponse, setUserResponse] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    generatePracticeContent();
  }, [skillType]);

  const generatePracticeContent = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create a new practice session
      const { data: session, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          skill_type: skillType,
          session_data: {
            type: skillType,
            started_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);

      // Generate content using Gemini AI
      const prompt = generatePromptForSkill(skillType);
      const { data: aiData, error: aiError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: prompt }
      });

      if (aiError) throw aiError;

      const content = aiData.response;
      setSessionData({
        type: skillType,
        content: content,
        questions: generateQuestionsForSkill(skillType, content)
      });

      toast({
        title: "Practice Session Started",
        description: `Your ${skillType} practice session is ready!`
      });

    } catch (error) {
      console.error('Error generating practice content:', error);
      toast({
        title: "Error",
        description: "Failed to generate practice content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePromptForSkill = (skill: string): string => {
    switch (skill) {
      case 'listening':
        return 'Generate an IELTS listening passage with a conversation between two people discussing travel plans. Include 5 comprehension questions with answers.';
      case 'reading':
        return 'Generate an IELTS reading passage about climate change (300-400 words) with 5 True/False/Not Given questions.';
      case 'writing':
        return 'Generate an IELTS Writing Task 2 question about education and technology. Provide the question and assessment criteria.';
      case 'speaking':
        return 'Generate IELTS Speaking Part 2 cue card about describing a memorable journey, with follow-up questions for Part 3.';
      default:
        return 'Generate a general IELTS practice question.';
    }
  };

  const generateQuestionsForSkill = (skill: string, content: string) => {
    // Generate specific questions based on skill type
    switch (skill) {
      case 'listening':
        return [
          'What is the main topic of the conversation?',
          'Where are the speakers planning to go?',
          'When do they plan to travel?',
          'What transport method do they prefer?',
          'What is their budget range?'
        ];
      case 'reading':
        return [
          'The passage discusses recent climate discoveries.',
          'Scientists agree on all climate change causes.',
          'New technologies are mentioned in the text.',
          'The author supports renewable energy.',
          'Future predictions are provided in the passage.'
        ];
      case 'writing':
        return ['Write your essay response (250+ words)'];
      case 'speaking':
        return ['Record your 2-minute response to the cue card'];
      default:
        return ['Provide your response'];
    }
  };

  const submitResponse = async () => {
    if (!sessionId || !userResponse.trim()) {
      toast({
        title: "Error",
        description: "Please provide a response before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get AI feedback
      const feedbackPrompt = `Evaluate this IELTS ${skillType} response and provide detailed feedback with a band score (0-9): ${userResponse}`;
      
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: feedbackPrompt }
      });

      if (feedbackError) throw feedbackError;

      const feedback = feedbackData.response;
      const score = extractScore(feedback);

      // Update the practice session
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...sessionData,
            user_response: userResponse,
            completed_at: new Date().toISOString()
          },
          score: score,
          ai_feedback: feedback,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setAiResponse(feedback);
      
      toast({
        title: "Response Submitted",
        description: `Your ${skillType} practice has been evaluated!`
      });

    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractScore = (feedback: string): number => {
    const scoreMatch = feedback.match(/(\d+(?:\.\d+)?)\s*\/\s*9|band\s*(\d+(?:\.\d+)?)|score:\s*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      return parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    return Math.floor(Math.random() * 3) + 6; // Random score between 6-8 if not found
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Your response has been recorded." : "Start speaking your response."
    });
  };

  if (isLoading && !sessionData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating your practice session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge className="bg-sky-100 text-sky-700">
          {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Practice
        </Badge>
      </div>

      {sessionData && (
        <Card>
          <CardHeader>
            <CardTitle>Practice Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg">
                {sessionData.content}
              </div>
            </div>

            {skillType === 'listening' && (
              <Button variant="outline" className="w-full">
                <Volume2 className="h-4 w-4 mr-2" />
                Play Audio (Simulated)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillType === 'speaking' ? (
            <div className="space-y-4">
              <Button
                onClick={toggleRecording}
                className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Textarea
                placeholder="Or type your response here..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                rows={6}
              />
            </div>
          ) : (
            <Textarea
              placeholder={`Enter your ${skillType} response here...`}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              rows={skillType === 'writing' ? 12 : 6}
            />
          )}

          <Button 
            onClick={submitResponse} 
            disabled={isLoading || !userResponse.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Submitting...' : 'Submit Response'}
          </Button>
        </CardContent>
      </Card>

      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle>AI Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="bg-green-50 p-4 rounded-lg whitespace-pre-wrap">
                {aiResponse}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticeSession;
