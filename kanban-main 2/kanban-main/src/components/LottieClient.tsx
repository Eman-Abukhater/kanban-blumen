'use client';

import dynamic from 'next/dynamic';

// this prevents lottie-web from loading on the server
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = React.ComponentProps<any>;

export default function LottieClient(props: Props) {
  // also guard at render time
  if (typeof window === 'undefined') return null;
  return <Lottie {...props} />;
}
