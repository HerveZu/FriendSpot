import { useCallback, useEffect, useState } from "react";
import Animated from "react-native-reanimated";

export function useForm() {
    const [inputErrors, setInputErrors] = useState<string[]>([]);
    const [isTouched, setIsTouched] = useState(autoTouch);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [touchTrigger, setTouchTrigger] = useState({});
    

    async function submit (callback :() => Promise<void>) {
        setLoadingAction(true);
        await callback().finally(() => setLoadingAction(false))
        setIsSubmitted(true);
    }

    const error = useCallback( 
      (id: string, error: boolean) => {
        if (error) {
          setInputErrors((errors) => [...new Set([...errors, id])]);
          return;
        }
  
        setInputErrors((errors) => errors.filter((otherId) => otherId !== id));
      },
      [setInputErrors]
    );
  
    const touch = useCallback(() => {
      setIsTouched(true);
      setTouchTrigger({});
    }, [setIsTouched, setTouchTrigger]);  
}

export default useForm;