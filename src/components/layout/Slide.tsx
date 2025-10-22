import React from 'react';

interface SlideProps {
  children: React.ReactNode;
}

const Slide: React.FC<SlideProps> = ({ children }) => {
  return (
    <section className="h-full w-full flex flex-col items-center justify-center relative p-4 md:p-8">
      {children}
    </section>
  );
};

export default Slide;
