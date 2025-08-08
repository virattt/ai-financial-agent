'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Green } from '../styles/colors';
import { Button } from './button';

interface NewsItem {
  ticker: string;
  title: string;
  author: string;
  source: string;
  date: string;
  url: string;
  image_url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsProps {
  data: {
    news: NewsItem[];
  };
}

export function News({ data }: NewsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { news } = data;

  if (!news || news.length === 0) return null;
  
  // Get ticker from news items if not provided directly
  const ticker = (news.length > 0 ? news[0].ticker : '');

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 300; // Approximate width of a card
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    const newPosition = scrollPosition + scrollAmount;
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    
    setScrollPosition(newPosition);
  };

  const formatNewsDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="news" className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-2 hover:no-underline hover:bg-muted rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Green}
              />
              <span className="text-muted-foreground text-sm">
                {ticker ? `${ticker} (News)` : 'News'}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="relative">
              {news.length > 3 && (
                <>
                  <Button 
                    onClick={() => handleScroll('left')} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 h-auto"
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    onClick={() => handleScroll('right')} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 h-auto"
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-6 py-4 gap-4 snap-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {news.map((item, index) => (
                  <Link 
                    href={item.url} 
                    key={index} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="snap-start"
                  >
                    <div className="flex flex-col w-[280px] rounded-lg overflow-hidden border hover:shadow-md transition-shadow duration-200 h-full">
                      <div className="h-[160px] relative bg-gray-100 dark:bg-gray-800">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image available
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">
                            {formatNewsDate(item.date)}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium line-clamp-3 mb-1">{item.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
