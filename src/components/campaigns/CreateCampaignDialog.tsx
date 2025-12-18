import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Zap } from "lucide-react";
import { useOffers } from "@/hooks/useRealData";
import { useGlobalOffers } from "@/hooks/useGlobalOffers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Name too long"),
  offer_id: z.string().min(1, "Please select an offer"),
  redirect_mode: z.enum(["302", "meta"], {
    required_error: "Please select a redirect mode",
  }),
  cost_model: z.enum(["CPC", "CPM", "CPA"], {
    required_error: "Please select a cost model",
  }),
  tracking_domain: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOfferId?: string;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  defaultOfferId,
}: CreateCampaignDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userOffers = [] } = useOffers();
  const { data: globalOffers = [] } = useGlobalOffers();
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine user offers and global offers, removing duplicates
  const allOffers = [...userOffers, ...globalOffers].reduce((acc, offer) => {
    if (!acc.find((o: any) => o.id === offer.id)) {
      acc.push(offer);
    }
    return acc;
  }, [] as any[]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      offer_id: defaultOfferId || "",
      redirect_mode: "302",
      cost_model: "CPC",
      tracking_domain: "cpazen.com",
    },
  });

  // Update form when defaultOfferId changes
  useEffect(() => {
    if (defaultOfferId && open) {
      form.setValue("offer_id", defaultOfferId);
      // Auto-fill campaign name based on offer
      const offer = allOffers.find(o => o.id === defaultOfferId);
      if (offer && !form.getValues("name")) {
        form.setValue("name", `${offer.name} Campaign`);
      }
    }
  }, [defaultOfferId, open, allOffers]);

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: values.name,
          offer_id: values.offer_id,
          redirect_mode: values.redirect_mode,
          cost_model: values.cost_model,
          tracking_domain: values.tracking_domain || "cpazen.com",
          status: "active",
        })
        .select(`
          *,
          offers (
            name,
            network,
            payout,
            offer_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      setCreatedCampaign(campaign);
      
      // Invalidate campaigns query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });

      toast({
        title: "Campaign Created!",
        description: `${values.name} has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedCampaign(null);
    form.reset();
    onOpenChange(false);
  };

  const generateTrackingLink = (campaignId: string) => {
    return `https://rdajybqalmsdycxsruon.supabase.co/functions/v1/track-click/${campaignId}?sub={sub_id}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Tracking link copied to clipboard",
    });
  };

  const selectedOffer = allOffers.find(offer => offer.id === form.watch("offer_id"));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {!createdCampaign ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand-teal" />
                Create New Campaign
              </DialogTitle>
              <DialogDescription>
                Set up a new affiliate campaign to start tracking clicks and conversions
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter campaign name..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a descriptive name for easy identification
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an offer..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allOffers.map((offer) => (
                            <SelectItem key={offer.id} value={offer.id}>
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <div className="font-medium">{offer.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {offer.network} • ${offer.payout} {offer.currency}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedOffer && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{selectedOffer.name}</h4>
                            <Badge variant="outline">{selectedOffer.network}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Payout: ${selectedOffer.payout} {selectedOffer.currency}</div>
                            <div>Daily Cap: {selectedOffer.daily_cap ? `${selectedOffer.daily_cap} conversions` : 'No limit'}</div>
                            <div>Countries: {selectedOffer.countries?.join(', ') || 'Global'}</div>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="redirect_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redirect Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="302">302 Redirect (Fast)</SelectItem>
                            <SelectItem value="meta">Meta Refresh (Cloaked)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === "302" ? "Direct HTTP redirect" : "Meta refresh with cloaking"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
                            <SelectItem value="CPM">CPM (Cost Per Mille)</SelectItem>
                            <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tracking_domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Domain (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cpazen.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom domain for tracking links (advanced users only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-brand hover:opacity-90"
                  >
                    {isSubmitting ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-success">Campaign Created Successfully!</DialogTitle>
              <DialogDescription>
                Your campaign is now live and ready to receive traffic
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <h3 className="font-semibold text-success mb-2">
                  {createdCampaign.name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer:</span>
                    <span>{createdCampaign.offers?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span>{createdCampaign.offers?.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payout:</span>
                    <span className="text-success font-medium">
                      ${createdCampaign.offers?.payout}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-success/10 text-success border-success/20">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Tracking Link</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm break-all">
                      {generateTrackingLink(createdCampaign.id)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateTrackingLink(createdCampaign.id))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Replace &#123;sub_id&#125; with your sub-affiliate ID for tracking
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Offer URL</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-sm break-all">
                      {createdCampaign.offers?.offer_url || 'Not available'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={createdCampaign.offers?.offer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} className="bg-gradient-brand hover:opacity-90">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
