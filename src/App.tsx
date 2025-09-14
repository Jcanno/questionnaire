import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Card, 
  Radio, 
  Checkbox, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Progress, 
  message,
  Result,
} from 'antd'
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { QUESTIONNAIRE_QUESTION_LIST, QuestionType } from './constans'
import './App.css'

const { Title, Text } = Typography
const { TextArea } = Input

interface Answer {
  questionId: number
  answer: string | string[]
}

const API_KEY = 'zI3HIeAbth8nzNBdvUAAthQX'

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | string>('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [questionHistory, setQuestionHistory] = useState<number[]>([1])

  const currentQuestion = QUESTIONNAIRE_QUESTION_LIST[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / QUESTIONNAIRE_QUESTION_LIST.length) * 100
  const [recordData, setRecordData] = useState([])

  // 获取数据
  const fetchData = async () => {
    
    try {
      const response = await axios.get(`https://textdb.online/${API_KEY}`, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })

      setRecordData(response.data ? response.data : [])
      
    } catch (error) {
    } finally {
    }
  }
  
  // 初始化当前答案
  useEffect(() => {
    const existingAnswer = answers.find(a => a.questionId === currentQuestion.id)
    if (existingAnswer) {
      setCurrentAnswer(existingAnswer.answer)
    } else {
      if (currentQuestion.type === QuestionType.CHECKBOX) {
        setCurrentAnswer([])
      } else {
        setCurrentAnswer('')
      }
    }
  }, [currentQuestion.id, answers])

  // 获取数据
  useEffect(() => {
    fetchData()
  }, [])

  // 保存答案
  const saveAnswer = () => {
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      answer: currentAnswer
    }

    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id)
      return [...filtered, newAnswer]
    })
  }

  // 获取下一题ID
  const getNextQuestionId = (): number | null => {
    if (currentQuestion.isLast) {
      return null
    }

    if (typeof currentQuestion.toId === 'number') {
      return currentQuestion.toId
    }

    if (typeof currentQuestion.toId === 'object') {
      // 根据当前答案选择下一题
      if (Array.isArray(currentAnswer)) {
        // 多选情况，取第一个选项对应的下一题
        const firstAnswer = currentAnswer[0]
        return firstAnswer ? (currentQuestion.toId as any)[firstAnswer] : null
      } else {
        // 单选情况
        return currentAnswer ? (currentQuestion.toId as any)[currentAnswer] : null
      }
    }

    return null
  }

  // 跳转到下一题
   const handleNext = async () => {
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      message.warning('请先回答问题')
      return
    }

    saveAnswer()

    const nextQuestionId = getNextQuestionId()
    if (nextQuestionId === null) {
      const newData = [...recordData, answers]
      await axios.get(`https://textdb.online/update/`, {
        params: {
          key: API_KEY,
          value: JSON.stringify(newData)
        }
      })

      setIsCompleted(true)
      return
    }

    const nextQuestionIndex = QUESTIONNAIRE_QUESTION_LIST.findIndex(q => q.id === nextQuestionId)
    if (nextQuestionIndex !== -1) {
      setCurrentQuestionIndex(nextQuestionIndex)
      setQuestionHistory(prev => [...prev, nextQuestionId])
    }
  }

  // 返回上一题
  const handlePrevious = () => {
    if (questionHistory.length > 1) {
      const newHistory = [...questionHistory]
      newHistory.pop() // 移除当前题目
      const previousQuestionId = newHistory[newHistory.length - 1]
      
      const previousQuestionIndex = QUESTIONNAIRE_QUESTION_LIST.findIndex(q => q.id === previousQuestionId)
      if (previousQuestionIndex !== -1) {
        setCurrentQuestionIndex(previousQuestionIndex)
        setQuestionHistory(newHistory)
      }
    }
  }

  // 处理答案变化
  const handleAnswerChange = (value: any) => {
    setCurrentAnswer(value)
  }

  // 渲染问题组件
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case QuestionType.RADIO:
        return (
          <Radio.Group 
            value={currentAnswer} 
            onChange={(e) => handleAnswerChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion.options?.map(option => (
                <Radio 
                  key={option.value} 
                  value={option.value} 
                  className="option-item"
                  style={{ fontSize: '16px', width: '100%' }}
                >
                  {option.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )

      case QuestionType.CHECKBOX:
        return (
          <Checkbox.Group 
            value={currentAnswer as string[]} 
            onChange={handleAnswerChange}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion.options?.map(option => (
                <Checkbox 
                  key={option.value} 
                  value={option.value} 
                  className="option-item"
                  style={{ fontSize: '16px', width: '100%' }}
                >
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )

      case QuestionType.TEXT:
        return (
          <Input 
            value={currentAnswer as string} 
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="请输入您的答案"
            style={{ fontSize: '16px' }}
          />
        )

      case QuestionType.TEXTAREA:
        return (
          <TextArea 
            value={currentAnswer as string} 
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="请输入您的答案"
            rows={4}
            style={{ fontSize: '16px' }}
          />
        )

      default:
        return null
    }
  }

  // 礼花动画组件
  const ConfettiAnimation = () => {
    return (
      <div className="confetti-container">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="confetti" />
        ))}
      </div>
    )
  }

  // 完成页面
  if (isCompleted) {
    return (
      <div className="completion-page">
        <ConfettiAnimation />
        <Card className="completion-card">
          <Result
            icon={<CheckCircleOutlined className="completion-icon" style={{ color: '#52c41a' }} />}
            title="问卷完成"
            subTitle="感谢您参与本次问卷调查，您的回答对我们非常重要。"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="questionnaire-container">
      <div style={{ margin: '0 auto' }}>
        {/* 进度条 */}
        <Card className="progress-card" style={{ marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Text strong>问卷进度</Text>
          </div>
          <Progress 
            percent={Math.round(progress)} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              第 {currentQuestionIndex + 1} 题，共 {QUESTIONNAIRE_QUESTION_LIST.length} 题
            </Text>
          </div>
        </Card>

        {/* 问题卡片 */}
        <Card className="question-card">
          <Title level={3} className="question-title">
            {currentQuestion.question}
          </Title>
          
          <div style={{ marginBottom: '32px' }}>
            {renderQuestion()}
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            

            <Space>
              <Text type="secondary" className="answer-counter">
                已保存 {answers.length} 个答案
              </Text>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={handlePrevious}
                disabled={questionHistory.length <= 1}
              >
                上一题
              </Button>
              <Button 
                type="primary" 
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                size="large"
              >
                {currentQuestion.isLast ? '完成问卷' : '下一题'}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default App
