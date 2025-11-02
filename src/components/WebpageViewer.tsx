import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

export const WebpageViewer = () => {
  const [url, setUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const webUrlRef = ref(database, 'SMART_FARM/webUrl');
    
    const unsubscribe = onValue(webUrlRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUrl(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoadUrl = () => {
    if (url.trim()) {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      // Force state update by clearing first
      setLoadedUrl('');
      setTimeout(() => setLoadedUrl(formattedUrl), 0);
    }
  };

  const handleClear = () => {
    setLoadedUrl('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-2 border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Web Viewer</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleLoadUrl}
                disabled={!url.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Go
              </Button>
              {loadedUrl && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-muted"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Iframe Container */}
        <AnimatePresence>
          {isExpanded && loadedUrl && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative w-full" style={{ paddingBottom: '26.25%' }}>
                <iframe
                  src={loadedUrl}
                  className="absolute top-0 left-0 w-full h-full border-none"
                  title="Embedded Webpage"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  loading="lazy"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {isExpanded && !loadedUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center"
          >
            <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Enter a URL above to view a webpage
            </p>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
