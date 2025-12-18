-- Create function to validate offer URL protocols
CREATE OR REPLACE FUNCTION public.validate_offer_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  url_lower TEXT;
BEGIN
  -- Normalize URL to lowercase for protocol check
  url_lower := lower(trim(NEW.offer_url));
  
  -- Block dangerous protocols
  IF url_lower LIKE 'javascript:%' OR
     url_lower LIKE 'data:%' OR
     url_lower LIKE 'vbscript:%' OR
     url_lower LIKE 'file:%' THEN
    RAISE EXCEPTION 'Invalid URL protocol. Only http:// and https:// URLs are allowed.';
  END IF;
  
  -- Ensure URL starts with http:// or https://
  IF NOT (url_lower LIKE 'http://%' OR url_lower LIKE 'https://%') THEN
    RAISE EXCEPTION 'Invalid URL. URL must start with http:// or https://';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for offer URL validation on INSERT
CREATE TRIGGER validate_offer_url_insert
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_offer_url();

-- Create trigger for offer URL validation on UPDATE
CREATE TRIGGER validate_offer_url_update
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  WHEN (OLD.offer_url IS DISTINCT FROM NEW.offer_url)
  EXECUTE FUNCTION public.validate_offer_url();