import React from 'react'

interface SocialContractProps {
  agreed: boolean
  onAgreeChange: (agreed: boolean) => void
}

export const SocialContract: React.FC<SocialContractProps> = ({ agreed, onAgreeChange }) => {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='text-center'>
        <h3 className="font-['Source_Serif_4',Georgia,serif] text-xl font-bold text-[#2f2b27]">
          The Honest Alpha Social Contract
        </h3>
        <p className="font-['Source_Serif_4',Georgia,serif] text-sm text-[#8b8680] italic mt-1">
          This isn't fine print. It's a handshake.
        </p>
      </div>

      {/* Contract Cards */}
      <div className='space-y-3'>
        {/* What We're Asking */}
        <div className='bg-[#faf9f7] rounded-xl border border-[#e8e4de] p-4'>
          <h4 className="font-['Source_Serif_4',Georgia,serif] text-sm font-semibold text-[#2f2b27] mb-2">
            What We're Asking of You
          </h4>
          <ul className='space-y-1.5 text-xs text-[#2f2b27]'>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Break things and test workflows</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Report problems when discovered</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Demonstrate patience with incomplete features</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Provide candid feedback</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Accept unpolished work</span>
            </li>
          </ul>
        </div>

        {/* What You're Getting */}
        <div className='bg-[#faf9f7] rounded-xl border border-[#e8e4de] p-4'>
          <h4 className="font-['Source_Serif_4',Georgia,serif] text-sm font-semibold text-[#2f2b27] mb-2">
            What You're Getting in Return
          </h4>
          <ul className='space-y-1.5 text-xs text-[#2f2b27]'>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Exclusive early access to fewer than 20 users</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Alpha-only Discord community access</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Direct feedback influence on development decisions</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Lifetime founder pricing discount</span>
            </li>
          </ul>
        </div>

        {/* Duration & What Happens Next */}
        <div className='bg-[#faf9f7] rounded-xl border border-[#e8e4de] p-4'>
          <h4 className="font-['Source_Serif_4',Georgia,serif] text-sm font-semibold text-[#2f2b27] mb-2">
            Duration & What Happens Next
          </h4>
          <ul className='space-y-1.5 text-xs text-[#2f2b27]'>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Alpha program concludes April 30, 2026</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>User accounts and builds persist through transition</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Automatic migration to beta (no action required)</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-[#8b8680] mt-0.5'>•</span>
              <span>Two-month grace period before paid tier launches</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className='flex items-start gap-3 pt-2'>
        <input
          type='checkbox'
          id='social-contract-agreement'
          checked={agreed}
          onChange={e => onAgreeChange(e.target.checked)}
          className='mt-0.5 w-4 h-4 text-[#2f2b27] border-[#e8e4de] rounded focus:ring-[#d0ccc5] focus:ring-offset-0 cursor-pointer accent-[#2f2b27]'
        />
        <label
          htmlFor='social-contract-agreement'
          className='text-xs text-[#2f2b27] cursor-pointer select-none leading-relaxed'
        >
          Let's do this.
        </label>
      </div>
    </div>
  )
}
