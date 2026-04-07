import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CNRSearchBarProps {
  onSearch: (cnr: string) => void;
  isSearching: boolean;
  isCompact?: boolean;
}

const CNR_REGEX = /^[A-Z]{4}\d{12}$/;

export const CNRSearchBar = ({ onSearch, isSearching, isCompact = false }: CNRSearchBarProps) => {
  const [cnr, setCnr] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const formatCNR = useCallback((value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Limit to 16 characters
    return cleaned.slice(0, 16);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNR(e.target.value);
    setCnr(formatted);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!CNR_REGEX.test(cnr)) {
      setError('Invalid CNR format. Please check and try again.');
      return;
    }

    onSearch(cnr);
  };

  const isValid = CNR_REGEX.test(cnr);
  const showValidation = cnr.length > 0;

  return (
    <motion.form
      onSubmit={handleSubmit}
      layout
      className={`w-full ${isCompact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}
    >
      <div className="relative">
        <div
          className={`
            relative flex items-center gap-3 p-2 rounded-xl border transition-all duration-300
            ${error ? 'border-destructive input-error' : isFocused ? 'border-primary input-glow' : 'border-border'}
            bg-card/50 backdrop-blur-sm
          `}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>

          <input
            type="text"
            value={cnr}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter 16-Digit CNR Number (e.g., TNCO123456789012)"
            className={`
              flex-1 bg-transparent border-none outline-none font-mono text-lg tracking-wider
              placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:text-base placeholder:tracking-normal
              ${isCompact ? 'text-base' : 'text-lg'}
            `}
            disabled={isSearching}
          />

          <AnimatePresence mode="wait">
            {showValidation && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`p-2 rounded-lg ${isValid ? 'text-success' : 'text-muted-foreground'}`}
              >
                {isValid ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-mono">{cnr.length}/16</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={isSearching || !cnr}
            className={`
              px-6 h-12 rounded-lg font-semibold transition-all duration-300
              bg-primary hover:bg-primary/90 text-primary-foreground
              disabled:opacity-50 disabled:cursor-not-allowed
              ${!isCompact && 'px-8'}
            `}
          >
            {isSearching ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
            ) : (
              'Verify & Search'
            )}
          </Button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="flex items-center gap-2 mt-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isCompact && (
        <p className="text-center text-xs text-muted-foreground/60 mt-3">
          CNR is a unique 16-character case identifier
        </p>
      )}
    </motion.form>
  );
};
