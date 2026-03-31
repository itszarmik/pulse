import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <SignUp
        afterSignUpUrl="/onboarding"
        signInUrl="/sign-in"
        appearance={{
          variables: {
            colorPrimary: '#00d4a0',
            colorBackground: '#13161d',
            colorInputBackground: '#1a1d26',
            colorInputText: '#e8eaf0',
            colorText: '#e8eaf0',
            colorTextSecondary: '#8b90a0',
            borderRadius: '0.5rem',
          },
          elements: {
            card: 'shadow-none border border-white/10',
            formButtonPrimary: 'bg-[#00d4a0] hover:bg-[#00b386] text-[#001a12]',
            footerActionLink: 'text-[#00d4a0]',
          }
        }}
      />
    </div>
  )
}
