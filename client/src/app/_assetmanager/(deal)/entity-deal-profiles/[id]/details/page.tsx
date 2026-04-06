'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEntityDealProfiles } from '@/modules/assetmanager/hooks/deal/use-entity-deal-profiles';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Briefcase, MapPin, Factory, DollarSign, Globe, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { useEffect, useState } from 'react';

export default function EntityDealProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    entityDealProfiles,
    isLoading,
    error,
    fetchEntityDealProfile,
    updateEntityDealProfile,
    deleteEntityDealProfile,
    fetchEntityDealProfiles
  } = useEntityDealProfiles();
  const { getEntityName } = useEntities();

  const profile = entityDealProfiles.find(p => p.id === profileId);

  // Settings state
  const [editEntityType, setEditEntityType] = useState<string>('');
  const [editIndustry, setEditIndustry] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editWebsite, setEditWebsite] = useState<string>('');
  const [editYearFounded, setEditYearFounded] = useState<string>('');
  const [editStage, setEditStage] = useState<string>('');
  const [editShortDescription, setEditShortDescription] = useState<string>('');
  const [editProblemDescription, setEditProblemDescription] = useState<string>('');
  const [editSolutionDescription, setEditSolutionDescription] = useState<string>('');
  const [editHowItWorks, setEditHowItWorks] = useState<string>('');
  const [editCurrentValuation, setEditCurrentValuation] = useState<string>('');
  const [editLatestRaiseAmount, setEditLatestRaiseAmount] = useState<string>('');
  const [editTotalRaised, setEditTotalRaised] = useState<string>('');
  const [editMarketSize, setEditMarketSize] = useState<string>('');
  const [editCompetitors, setEditCompetitors] = useState<string>('');
  const [editCompetitiveAdvantage, setEditCompetitiveAdvantage] = useState<string>('');
  const [editGrowthMetrics, setEditGrowthMetrics] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditEntityType(profile.entity_type);
      setEditIndustry(profile.industry);
      setEditLocation(profile.location);
      setEditWebsite(profile.website || '');
      setEditYearFounded(profile.year_founded?.toString() || '');
      setEditStage(profile.stage || '');
      setEditShortDescription(profile.short_description);
      setEditProblemDescription(profile.problem_description);
      setEditSolutionDescription(profile.solution_description);
      setEditHowItWorks(profile.how_it_works);
      setEditCurrentValuation(profile.current_valuation?.toString() || '');
      setEditLatestRaiseAmount(profile.latest_raise_amount?.toString() || '');
      setEditTotalRaised(profile.total_raised?.toString() || '');
      setEditMarketSize(profile.market_size?.toString() || '');
      setEditCompetitors(profile.competitors || '');
      setEditCompetitiveAdvantage(profile.competitive_advantage || '');
      setEditGrowthMetrics(profile.growth_metrics || '');
    }
  }, [profile]);

  // Fetch profile if not in store
  useEffect(() => {
    if (profileId && !profile) {
      fetchEntityDealProfile(profileId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Entity deal profile not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation text
  const deleteConfirmTarget = profile.short_description || `Profile ${profile.id}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/entity-deal-profiles">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Entity Deal Profiles
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {profile.short_description || 'Entity Deal Profile'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getEntityTypeLabel(profile.entity_type)}
                </Badge>
                {profile.stage && (
                  <Badge variant="outline">{profile.stage}</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {getEntityName(profile.entity_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Briefcase className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core details about this deal profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  <p className="text-lg font-medium">{getEntityTypeLabel(profile.entity_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity</p>
                  <p className="text-lg font-medium">{getEntityName(profile.entity_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="text-lg font-medium">{profile.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-lg font-medium">{profile.location}</p>
                  </div>
                </div>
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="text-lg font-medium">{profile.website}</p>
                    </div>
                  </div>
                )}
                {profile.year_founded && (
                  <div>
                    <p className="text-sm text-muted-foreground">Year Founded</p>
                    <p className="text-lg font-medium">{profile.year_founded}</p>
                  </div>
                )}
                {profile.stage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <p className="text-lg font-medium">{profile.stage}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Financial details and valuation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {profile.current_valuation !== null && profile.current_valuation !== undefined && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Valuation</p>
                      <p className="text-lg font-medium">${profile.current_valuation.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {profile.latest_raise_amount !== null && profile.latest_raise_amount !== undefined && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Latest Raise</p>
                      <p className="text-lg font-medium">${profile.latest_raise_amount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {profile.total_raised !== null && profile.total_raised !== undefined && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Raised</p>
                      <p className="text-lg font-medium">${profile.total_raised.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {profile.market_size !== null && profile.market_size !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Market Size</p>
                    <p className="text-lg font-medium">${profile.market_size.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Descriptions and competitive positioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Short Description</p>
                <p className="text-lg font-medium">{profile.short_description}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Problem Description</p>
                <p className="text-lg font-medium">{profile.problem_description}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Solution Description</p>
                <p className="text-lg font-medium">{profile.solution_description}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">How It Works</p>
                <p className="text-lg font-medium">{profile.how_it_works}</p>
              </div>
              {profile.competitors && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Competitors</p>
                  <p className="text-lg font-medium">{profile.competitors}</p>
                </div>
              )}
              {profile.competitive_advantage && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Competitive Advantage</p>
                  <p className="text-lg font-medium">{profile.competitive_advantage}</p>
                </div>
              )}
              {profile.growth_metrics && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Growth Metrics</p>
                  <p className="text-lg font-medium">{profile.growth_metrics}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update deal profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-entity-type">Entity Type</Label>
                  <Select
                    value={editEntityType}
                    onValueChange={setEditEntityType}
                  >
                    <SelectTrigger id="profile-entity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="fund">Fund</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-industry">Industry *</Label>
                  <Input
                    id="profile-industry"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-location">Location *</Label>
                  <Input
                    id="profile-location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-website">Website</Label>
                  <Input
                    id="profile-website"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-year-founded">Year Founded</Label>
                  <Input
                    id="profile-year-founded"
                    type="number"
                    value={editYearFounded}
                    onChange={(e) => setEditYearFounded(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-stage">Stage</Label>
                  <Input
                    id="profile-stage"
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-current-valuation">Current Valuation</Label>
                  <Input
                    id="profile-current-valuation"
                    type="number"
                    step="0.01"
                    value={editCurrentValuation}
                    onChange={(e) => setEditCurrentValuation(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-latest-raise">Latest Raise Amount</Label>
                  <Input
                    id="profile-latest-raise"
                    type="number"
                    step="0.01"
                    value={editLatestRaiseAmount}
                    onChange={(e) => setEditLatestRaiseAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-total-raised">Total Raised</Label>
                  <Input
                    id="profile-total-raised"
                    type="number"
                    step="0.01"
                    value={editTotalRaised}
                    onChange={(e) => setEditTotalRaised(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-market-size">Market Size</Label>
                  <Input
                    id="profile-market-size"
                    type="number"
                    step="0.01"
                    value={editMarketSize}
                    onChange={(e) => setEditMarketSize(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-short-desc">Short Description *</Label>
                <Textarea
                  id="profile-short-desc"
                  value={editShortDescription}
                  onChange={(e) => setEditShortDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-problem-desc">Problem Description *</Label>
                <Textarea
                  id="profile-problem-desc"
                  value={editProblemDescription}
                  onChange={(e) => setEditProblemDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-solution-desc">Solution Description *</Label>
                <Textarea
                  id="profile-solution-desc"
                  value={editSolutionDescription}
                  onChange={(e) => setEditSolutionDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-how-it-works">How It Works *</Label>
                <Textarea
                  id="profile-how-it-works"
                  value={editHowItWorks}
                  onChange={(e) => setEditHowItWorks(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-competitors">Competitors</Label>
                <Textarea
                  id="profile-competitors"
                  value={editCompetitors}
                  onChange={(e) => setEditCompetitors(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-competitive-advantage">Competitive Advantage</Label>
                <Textarea
                  id="profile-competitive-advantage"
                  value={editCompetitiveAdvantage}
                  onChange={(e) => setEditCompetitiveAdvantage(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-growth-metrics">Growth Metrics</Label>
                <Textarea
                  id="profile-growth-metrics"
                  value={editGrowthMetrics}
                  onChange={(e) => setEditGrowthMetrics(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <Button
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    await updateEntityDealProfile(profileId, {
                      entity_type: editEntityType as 'company' | 'fund' | 'target' | 'individual',
                      industry: editIndustry,
                      location: editLocation,
                      website: editWebsite || null,
                      year_founded: editYearFounded ? parseInt(editYearFounded) : null,
                      stage: editStage || null,
                      short_description: editShortDescription,
                      problem_description: editProblemDescription,
                      solution_description: editSolutionDescription,
                      how_it_works: editHowItWorks,
                      current_valuation: editCurrentValuation ? parseFloat(editCurrentValuation) : null,
                      latest_raise_amount: editLatestRaiseAmount ? parseFloat(editLatestRaiseAmount) : null,
                      total_raised: editTotalRaised ? parseFloat(editTotalRaised) : null,
                      market_size: editMarketSize ? parseFloat(editMarketSize) : null,
                      competitors: editCompetitors || null,
                      competitive_advantage: editCompetitiveAdvantage || null,
                      growth_metrics: editGrowthMetrics || null,
                    });
                    await fetchEntityDealProfiles({ entity_id: profile?.entity_id });
                  } catch (error) {
                    console.error('Failed to update profile:', error);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a deal profile, there is no going back. This will permanently delete the profile record.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-profile">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-profile"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Profile description"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteEntityDealProfile(profileId);
                      router.push('/entity-deal-profiles');
                    } catch (error) {
                      console.error('Failed to delete profile:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== deleteConfirmTarget}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
