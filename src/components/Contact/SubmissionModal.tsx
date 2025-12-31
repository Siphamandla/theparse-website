"use client";

interface SubmissionModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'duplicate';
  userEmail?: string;
  submissionId?: string;
  onClose: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  type,
  userEmail,
  submissionId,
  onClose,
}) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          title: 'Thank You! Your Inquiry Has Been Received',
          message: `We've received your contact form submission. A confirmation email has been sent to ${userEmail}. Our team will review your inquiry and get back to you as soon as possible.`,
          buttonText: 'Close',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'duplicate':
        return {
          icon: 'ℹ',
          title: 'We Already Have Your Inquiry',
          message: `We've already received an inquiry from ${userEmail}. Our team will be in touch with you shortly. Please check your email for updates.`,
          buttonText: 'Got It',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'error':
        return {
          icon: '✕',
          title: 'Oops! Something Went Wrong',
          message: 'We encountered an error while submitting your form. Please try again later or contact us directly.',
          buttonText: 'Close',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${content.bgColor} border-l-4 ${content.borderColor} rounded-lg shadow-lg max-w-md w-full mx-4 p-6 md:p-8`}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${content.iconColor} text-5xl font-bold`}>
            {content.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-3">
          {content.title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 text-center text-sm md:text-base mb-6 leading-relaxed">
          {content.message}
        </p>

        {/* Submission ID (if available) */}
        {submissionId && (
          <div className="bg-white bg-opacity-50 rounded p-3 mb-6 text-center">
            <p className="text-xs text-gray-500 mb-1">Submission ID</p>
            <p className="text-sm font-mono text-gray-700 break-all">{submissionId}</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`w-full ${content.buttonColor} text-white font-medium py-2 px-4 rounded-sm transition duration-200 ease-in-out`}
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
};

export default SubmissionModal;
