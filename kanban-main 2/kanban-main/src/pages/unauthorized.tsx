
import dynamic from 'next/dynamic';
const LottieClient = dynamic(() => import('@/components/LottieClient'), { ssr: false });
import animationLoad1 from "../../public/animationDenied.json";



export default function umAuthorized() {


  return (
    <>
      <div className="flex h-screen flex-col bg-gray-100">
        <div className="flex flex-grow items-center justify-center">
          <div className="h-1/2 w-1/2 md:h-1/4 md:w-1/4">
            <LottieClient animationData={animationLoad1} loop={true} />
          </div>
        </div>

      </div>
    </>
  );
}
