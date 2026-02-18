import { MainContent } from "./MainContent";

export interface IMainLayoutProps {}

export function MainLayout(props: IMainLayoutProps) {
  return (
    <>
      <div className="relative flex min-h-screen flex-col px-4 pt-14 sm:px-6 sm:py-8">
        <MainContent />
      </div>
    </>
  );
}
