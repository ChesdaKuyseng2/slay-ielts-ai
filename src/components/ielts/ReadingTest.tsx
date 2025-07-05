
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReadingTestProps {
  testData: any;
  sessionId: string;
  onComplete: (answers: any) => void;
  onExplainAnswer: (questionIndex: number) => void;
}

const ReadingTest: React.FC<ReadingTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete, 
  onExplainAnswer 
}) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Time's Up!",
            description: "Your test has been automatically submitted.",
            variant: "destructive"
          });
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting reading test with answers:', answers);
      
      // Ensure we have valid answers structure
      const validAnswers = {
        ...answers,
        sessionId,
        completedAt: new Date().toISOString(),
        skillType: 'reading'
      };
      
      await onComplete(validAnswers);
    } catch (error) {
      console.error('Error submitting reading test:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Use AI-generated content if available, otherwise use enhanced fallback
  const passage = testData?.passage || `
    <h3>The Impact of Technology on Modern Education Systems</h3>
    
    <p><strong>A</strong> The integration of advanced technology in educational institutions has fundamentally revolutionized the way students learn and teachers deliver instruction across all academic levels. From interactive digital whiteboards and sophisticated learning management systems to comprehensive online platforms and virtual reality experiences, technology has become an indispensable component in contemporary education. This transformation has not only changed the physical classroom environment but has also redefined the traditional roles and responsibilities of both educators and learners in the modern academic landscape.</p>
    
    <p><strong>B</strong> Extensive research conducted by leading educational institutions indicates that students who regularly engage with technology-enhanced learning methodologies demonstrate significantly improved engagement levels, retention rates, and academic performance compared to those using conventional teaching approaches. Interactive educational software, immersive virtual reality experiences, and carefully designed gamified learning platforms have successfully made complex subjects more accessible, engaging, and enjoyable for students across diverse age groups and learning abilities. However, the overall effectiveness of these technological interventions largely depends on how systematically and thoughtfully the technology is integrated into the existing curriculum and the educator's willingness and ability to adapt their established teaching methodologies accordingly.</p>
    
    <p><strong>C</strong> Despite the numerous documented benefits and positive outcomes, some experienced educators and child development specialists argue that excessive reliance on digital technology may potentially diminish students' critical thinking capabilities, problem-solving skills, and meaningful face-to-face social interaction among peers. The primary concern raised by these professionals is that students might develop an unhealthy dependence on digital tools and automated systems for problem-solving and decision-making, which could potentially affect their ability to think independently, analyze information critically, and develop essential interpersonal communication skills. Additionally, the persistent digital divide continues to be a significant socioeconomic challenge, as not all students have equal access to high-quality technological resources, reliable internet connectivity, and necessary technical support.</p>
    
    <p><strong>D</strong> Looking toward the future of education with realistic optimism and careful consideration, the primary challenge facing educational institutions lies in discovering and maintaining the optimal balance between cutting-edge technological advancement and time-tested traditional pedagogical approaches. Educational policymakers, administrators, and classroom teachers must carefully evaluate and consider how to implement emerging technologies in ways that genuinely enhance and support rather than completely replace the fundamental human elements of effective teaching and meaningful learning. The ultimate goal should be to strategically utilize technology as a powerful supplementary tool that amplifies and supports authentic human learning experiences, rather than attempting to substitute the essential personal connections, mentorship, and individualized guidance that form the cornerstone of quality education.</p>
    
    <p><strong>E</strong> The ongoing global discussion and debate surrounding the appropriate role of technology in education reflects the inherent complexity and multifaceted nature of this critical issue in contemporary society. Educational stakeholders, including teachers, administrators, parents, policymakers, and technology developers, continue to collaborate extensively and work together systematically to identify, develop, and implement balanced, effective, and sustainable solutions that adequately address the various challenges and concerns while simultaneously maximizing the tremendous potential benefits and opportunities that technology can provide to enhance educational outcomes for all students.</p>
  `;

  // Generate exactly 10 questions - 8 True/False/Not Given + 2 Summary Completion
  const tfngQuestions = [
    'Technology has completely replaced traditional teaching methods in all educational institutions.',
    'Students demonstrate better academic performance with technology-enhanced learning according to research studies.',
    'All educators unanimously support the unlimited integration of technology in classroom environments.',
    'The digital divide affects students\' equal access to technological educational resources.',
    'Finding the optimal balance between technology and traditional teaching methods is a current challenge.',
    'Interactive educational software has made complex subjects more accessible for students.',
    'Virtual reality technology is mentioned as being used exclusively in higher education institutions.',
    'The effectiveness of educational technology depends significantly on proper curriculum integration.'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Timer */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Time Remaining:</span>
            </div>
            <Badge variant={timeLeft < 600 ? "destructive" : "default"} className="text-lg px-3 py-1">
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Passage */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Reading Passage</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Read the passage carefully and answer the questions on the right.
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm leading-relaxed bg-gray-50 p-6 rounded-lg max-h-[600px] overflow-y-auto border">
              <div dangerouslySetInnerHTML={{ __html: passage }} />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Questions 1-10</CardTitle>
            <p className="text-sm text-gray-600">
              Answer all questions based on the reading passage.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* True/False/Not Given Questions (1-8) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600 border-b pb-2">
                Questions 1-8: True/False/Not Given
              </h3>
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>TRUE</strong> - if the statement agrees with the information in the passage</p>
                <p><strong>FALSE</strong> - if the statement contradicts the information in the passage</p>
                <p><strong>NOT GIVEN</strong> - if there is no information about this in the passage</p>
              </div>
              
              {tfngQuestions.map((statement, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-3 text-sm font-medium">
                        {index + 1}. {statement}
                      </p>
                      <div className="flex space-x-4">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map(option => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`tfng_${index}`}
                              value={option}
                              checked={answers[`tfng_${index}`] === option}
                              onChange={(e) => handleAnswerChange(`tfng_${index}`, e.target.value)}
                              className="text-blue-600"
                            />
                            <span className="text-sm font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExplainAnswer(index)}
                      className="ml-2"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Completion Questions (9-10) */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-blue-600 border-b pb-2">
                Questions 9-10: Summary Completion
              </h3>
              <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                Complete the summary using <strong>ONE WORD ONLY</strong> from the passage for each answer.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">
                    <strong>9.</strong> The integration of technology in education has{' '}
                    <Input 
                      className="inline-block w-32 mx-1 h-8 text-sm"
                      value={answers['summary_1'] || ''}
                      onChange={(e) => handleAnswerChange('summary_1', e.target.value)}
                      placeholder="word"
                    />{' '}
                    the way students learn and teachers deliver instruction.
                  </p>
                  
                  <p className="text-sm leading-relaxed">
                    <strong>10.</strong> Some educators worry that excessive dependence on digital tools may affect students' ability to think{' '}
                    <Input 
                      className="inline-block w-32 mx-1 h-8 text-sm"
                      value={answers['summary_2'] || ''}
                      onChange={(e) => handleAnswerChange('summary_2', e.target.value)}
                      placeholder="word"
                    />{' '}
                    and solve problems without technological assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="flex justify-between items-center pt-6 border-t bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Progress:</strong> {Object.keys(answers).length} / 10 answered</p>
                <p className="text-xs mt-1">Make sure to answer all questions before submitting</p>
              </div>
              <Button 
                onClick={handleSubmit} 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || Object.keys(answers).length < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadingTest;
