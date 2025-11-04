import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function PodcastQuestionOptimizer() {
  const [audience, setAudience] = useState('');
  const [guestBio, setGuestBio] = useState('');
  const [questions, setQuestions] = useState('');
  const [generateMode, setGenerateMode] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const handleSubmitClick = () => {
    if (!audience.trim() || !guestBio.trim()) {
      setError('Please fill in audience and guest bio fields.');
      return;
    }

    if (!generateMode && !questions.trim()) {
      setError('Please enter your questions or check "Come up with questions for me".');
      return;
    }

    // Show email modal first
    setShowEmailModal(true);
    setError(null);
  };

  const submitEmailAndContinue = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmittingEmail(true);
    setError(null);

    try {
      // Submit email to Google Sheets and Mailchimp
      const response = await fetch('https://podcast-question-proxy.hugo-3ec.workers.dev/submit-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || 'Anonymous',
          timestamp: new Date().toISOString(),
          audience: audience.trim(),
          guestBio: guestBio.trim(),
          questions: questions.trim(),
          generateMode: generateMode
        })
      });

      // Log response for debugging
      console.log('Email submission response status:', response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log('Email submission response:', responseData);
      console.log('Google Sheets result:', responseData.sheets);
      console.log('Mailchimp result:', responseData.mailchimp);

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to submit email: ${response.status}`);
      }

      // Log success
      console.log('Email submitted successfully:', responseData);

      // Close modal and proceed with analysis
      setShowEmailModal(false);
      await analyzQuestions();
    } catch (err) {
      console.error('Error submitting email:', err);
      // Show error but still allow them to continue (don't block the flow)
      setError(err.message || 'Failed to submit email. Please try again.');
      // Still close modal and proceed - don't block the user experience
      setShowEmailModal(false);
      setSubmittingEmail(false);
      // Continue with analysis even if email submission failed
      await analyzQuestions();
    }
  };

  const analyzQuestions = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      let prompt;
      
      if (generateMode) {
        // Generate questions mode
        prompt = `You are a professional journalist and interviewing expert. Your role is to create excellent podcast interview questions based on journalism best practices.

IMPORTANT: Focus on crafting questions that inspire the guest to tell stories. Great podcast questions encourage narrative responses, personal anecdotes, and detailed experiences rather than simple yes/no or factual answers.

PODCAST AUDIENCE:
${audience}

GUEST BIO:
${guestBio}

Please generate 8-12 thoughtful, engaging interview questions for this podcast. For your response, use the following JSON structure:

{
  "introduction": "A brief 2-3 sentence explanation of your approach to these questions",
  "questions": [
    {
      "question": "the interview question",
      "purpose": "what this question aims to achieve",
      "followUpSuggestion": "a suggestion for a potential follow-up question or direction"
    }
  ],
  "journalismPrinciples": ["principle 1 applied", "principle 2 applied", "principle 3 applied"],
  "interviewTips": ["tip 1 for conducting this interview", "tip 2", "tip 3"]
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON structure. Do not use markdown code blocks or backticks. Your entire response must be a single valid JSON object.`;
      } else {
        // Analyze existing questions mode
        prompt = `You are a professional journalist and interviewing expert. Your role is to provide constructive criticism and help improve podcast interview questions based on journalism best practices.

IMPORTANT: Evaluate whether questions inspire the guest to tell stories. Great podcast questions encourage narrative responses, personal anecdotes, and detailed experiences rather than simple yes/no or factual answers. Provide feedback on how to make questions more story-driven.

PODCAST AUDIENCE:
${audience}

GUEST BIO:
${guestBio}

INTERVIEW QUESTIONS:
${questions}

Please analyze these questions and provide detailed feedback. For your response, use the following JSON structure:

{
  "overallAssessment": "A brief 2-3 sentence overall assessment of the questions",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "questionFeedback": [
    {
      "original": "the original question text",
      "feedback": "specific feedback about this question",
      "improved": "your improved version of the question",
      "reasoning": "why this improvement works better"
    }
  ],
  "journalismPrinciples": ["principle 1 applied", "principle 2 applied", "principle 3 applied"],
  "additionalTips": ["tip 1", "tip 2", "tip 3"]
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON structure. Do not use markdown code blocks or backticks. Your entire response must be a single valid JSON object.`;
      }

      // Use Cloudflare Worker proxy (secure)
      const response = await fetch('https://podcast-question-proxy.hugo-3ec.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional journalist and interviewing expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content;
      
      // Strip markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedFeedback = JSON.parse(responseText);
      setFeedback(parsedFeedback);
    } catch (err) {
      console.error('Error analyzing questions:', err);
      setError(err.message || 'Failed to analyze questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFeedback(null);
    setError(null);
    setEmail('');
    setName('');
    setShowEmailModal(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0113',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '24px',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            Podcast Interview Optimizer
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            AI-powered journalism insights to elevate your interview questions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {!feedback ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Input Form */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Podcast Audience
                </label>
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Describe your audience demographics, interests, and what they hope to learn..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '16px',
                    background: '#0B0113',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Guest Bio
                </label>
                <textarea
                  value={guestBio}
                  onChange={(e) => setGuestBio(e.target.value)}
                  placeholder="Share your guest's background, expertise, achievements, and why they're being interviewed..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '16px',
                    background: '#0B0113',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Interview Questions
                </label>
                
                <div style={{
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    id="generateMode"
                    checked={generateMode}
                    onChange={(e) => setGenerateMode(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#FECE00'
                    }}
                  />
                  <label
                    htmlFor="generateMode"
                    style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Come up with questions for me
                  </label>
                </div>

                {!generateMode && (
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="Enter your interview questions (one per line or numbered)..."
                    style={{
                      width: '100%',
                      minHeight: '240px',
                      padding: '16px',
                      background: '#0B0113',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '15px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.6'
                    }}
                  />
                )}
                
                {generateMode && (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(254, 206, 0, 0.1)',
                    border: '1px solid rgba(254, 206, 0, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#FECE00' }}>AI Generation Mode:</strong> Based on your audience and guest information, I'll create professional interview questions tailored to your podcast.
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertCircle size={20} color="#ef4444" />
                  <span style={{ color: '#fca5a5' }}>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmitClick}
                disabled={loading || submittingEmail}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: (loading || submittingEmail) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: (loading || submittingEmail) ? 'rgba(255,255,255,0.5)' : '#0B0113',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (loading || submittingEmail) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                  transform: (loading || submittingEmail) ? 'none' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !submittingEmail) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  if (!loading && !submittingEmail) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    {generateMode ? 'Generating Questions...' : 'Analyzing Questions...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    {generateMode ? 'Generate Questions' : 'Analyze Questions'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Results */}
            <div style={{ marginBottom: '32px' }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ← {generateMode ? 'Generate New Questions' : 'Analyze New Questions'}
              </button>
            </div>

            {/* Generated Questions Flow */}
            {generateMode && feedback.questions ? (
              <div>
                {/* Introduction */}
                <div style={{
                  background: 'rgba(254, 206, 0, 0.1)',
                  border: '1px solid rgba(254, 206, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <Sparkles size={24} color="#FECE00" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Generated Questions</h2>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                    {feedback.introduction}
                  </p>
                </div>

                {/* Questions List */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '24px',
                    background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Your Interview Questions
                  </h2>
                  {feedback.questions.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#FECE00',
                        marginBottom: '16px'
                      }}>
                        QUESTION {i + 1}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{
                          margin: 0,
                          padding: '16px',
                          background: 'linear-gradient(90deg, rgba(254, 206, 0, 0.1) 0%, rgba(244, 76, 10, 0.1) 50%, rgba(242, 61, 190, 0.1) 100%)',
                          border: '1px solid rgba(254, 206, 0, 0.3)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          fontWeight: '500'
                        }}>
                          {item.question}
                        </p>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Purpose
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {item.purpose}
                        </p>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Follow-up Suggestion
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)',
                          fontStyle: 'italic'
                        }}>
                          {item.followUpSuggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Journalism Principles */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#D16A97'
                  }}>
                    Journalism Best Practices Applied
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.journalismPrinciples.map((principle, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{principle}</li>
                    ))}
                  </ul>
                </div>

                {/* Interview Tips */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#FECE00'
                  }}>
                    Interview Tips
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.interviewTips.map((tip, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                {/* Overall Assessment */}
                <div style={{
                  background: 'rgba(254, 206, 0, 0.1)',
                  border: '1px solid rgba(254, 206, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={24} color="#FECE00" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Overall Assessment</h2>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                    {feedback.overallAssessment}
                  </p>
                </div>

                {/* Strengths & Areas for Improvement */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#FECE00'
                    }}>
                      Strengths
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                      {feedback.strengths.map((strength, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#D16A97'
                    }}>
                      Areas for Improvement
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                      {feedback.areasForImprovement.map((area, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Question Feedback */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '24px',
                    background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Question-by-Question Feedback
                  </h2>
                  {feedback.questionFeedback.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#FECE00',
                        marginBottom: '16px'
                      }}>
                        QUESTION {i + 1}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Original
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          lineHeight: '1.6'
                        }}>
                          {item.original}
                        </p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Feedback
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {item.feedback}
                        </p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#FECE00',
                          marginBottom: '8px'
                        }}>
                          Improved Version
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '12px',
                          background: 'linear-gradient(90deg, rgba(254, 206, 0, 0.1) 0%, rgba(244, 76, 10, 0.1) 50%, rgba(242, 61, 190, 0.1) 100%)',
                          border: '1px solid rgba(254, 206, 0, 0.3)',
                          borderRadius: '6px',
                          lineHeight: '1.6'
                        }}>
                          {item.improved}
                        </p>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Why This Works
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)',
                          fontStyle: 'italic'
                        }}>
                          {item.reasoning}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Journalism Principles */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#D16A97'
                  }}>
                    Journalism Best Practices Applied
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.journalismPrinciples.map((principle, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{principle}</li>
                    ))}
                  </ul>
                </div>

                {/* Additional Tips */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#FECE00'
                  }}>
                    Additional Tips
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.additionalTips.map((tip, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => !submittingEmail && setShowEmailModal(false)}>
          <div style={{
            background: 'rgba(11, 1, 19, 0.98)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Where would you like us to send the answers to?
              </h2>
              <button
                onClick={() => !submittingEmail && setShowEmailModal(false)}
                disabled={submittingEmail}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: submittingEmail ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={18} color="#ef4444" />
                <span style={{ color: '#fca5a5', fontSize: '14px' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#FECE00'
              }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={submittingEmail}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0B0113',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !submittingEmail && email.trim()) {
                    submitEmailAndContinue();
                  }
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={submittingEmail}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0B0113',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !submittingEmail && email.trim()) {
                    submitEmailAndContinue();
                  }
                }}
              />
            </div>

            <button
              onClick={submitEmailAndContinue}
              disabled={submittingEmail || !email.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: (submittingEmail || !email.trim()) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: (submittingEmail || !email.trim()) ? 'rgba(255,255,255,0.5)' : '#0B0113',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (submittingEmail || !email.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!submittingEmail && email.trim()) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                if (!submittingEmail) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {submittingEmail ? (
                <>
                  <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Continue
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

