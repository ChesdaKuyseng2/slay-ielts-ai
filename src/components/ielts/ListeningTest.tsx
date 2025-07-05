
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, RotateCcw, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ListeningTestProps {
  testData: any;
  sessionId: string;
  onComplete: (answers: any) => void;
  onExplainAnswer: (questionIndex: number) => void;
}

const ListeningTest: React.FC<ListeningTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete, 
  onExplainAnswer 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    saveProgress();
  };

  const saveProgress = async () => {
    try {
      await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...testData,
            answers,
            progress: 'in_progress',
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleSubmit = () => {
    onComplete(answers);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Audio Player Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-blue-600" />
            <span>IELTS Listening Test - Section {testData.section || 1}</span>
            <Badge variant="outline" className="ml-auto">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <audio
            ref={audioRef}
            src={testData.audioUrl || "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBj+g4PK8ZyAFl"}
            preload="metadata"
          />
          
          <div className="flex items-center space-x-4">
            <Button onClick={togglePlayPause} size="lg">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button onClick={resetAudio} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>

            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </Button>

          {showTranscript && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                {testData.transcript || "Transcript will be available here..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Questions {testData.questionRange || "1-10"}</CardTitle>
          <p className="text-sm text-gray-600">
            Choose the correct letter A, B, or C, or fill in the blanks.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {testData.questions?.map((question: any, index: number) => (
            <div key={index} className="border-l-2 border-gray-200 pl-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium mb-3">
                    {index + 1}. {question.question}
                  </p>
                  
                  {question.type === 'multiple_choice' ? (
                    <div className="space-y-2">
                      {question.options?.map((option: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question_${index}`}
                            value={option}
                            onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                            className="text-blue-600"
                          />
                          <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder="Type your answer here..."
                      value={answers[`question_${index}`] || ''}
                      onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                      className="max-w-md"
                    />
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExplainAnswer(index)}
                  className="ml-4"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between pt-6 border-t">
            <div className="text-sm text-gray-600">
              Progress: {Object.keys(answers).length} / {testData.questions?.length || 0} answered
            </div>
            <Button onClick={handleSubmit} size="lg" className="bg-green-600 hover:bg-green-700">
              Submit Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListeningTest;
