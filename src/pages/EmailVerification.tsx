// /janhavi/Desktop/web_Dev/Ecommerce/ChatApp/src/pages/EmailVerification.tsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../api/apiclient'

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const emailFromState = location.state?.email || ''
    const messageFromState = location.state?.message || ''
    
    setEmail(emailFromState)
    
    // If we have a registration message, show waiting state
    if (messageFromState && !token) {
      setStatus('waiting')
      setMessage(messageFromState)
      return
    }
    
    // If we have a token, verify the email
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('waiting')
      setMessage('Please check your email and click the verification link.')
    }
  }, [searchParams, location.state])

  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token)
      setStatus('success')
      setMessage(response.message || 'Email verified successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?message=Email verified! You can now log in.')
      }, 3000)
      
    } catch (error: any) {
      setStatus('error')
      setMessage(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Email verification failed'
      )
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Please provide your email address to resend verification.')
      return
    }

    try {
      await authService.resendVerification(email)
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'waiting' && (
            <>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              {email && (
                <p className="text-sm text-gray-500 mb-6">Verification email sent to: <strong>{email}</strong></p>
              )}
              
              <div className="space-y-3">
                {email && (
                  <button
                    onClick={handleResendVerification}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Resend Verification Email
                  </button>
                )}
                <Link
                  to="/login"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Link
                  to="/resend-verification"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/login"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailVerification