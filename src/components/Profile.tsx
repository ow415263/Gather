import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserPosts } from '@/hooks/use-posts'
import { useTribeProfile } from '@/hooks/use-tribe-profile'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Heart, ChatCircle, Camera, ImageSquare } from '@phosphor-icons/react'
import { RecipesPage } from '@/pages/RecipesPage'

interface ProfileProps {
  sharedUrl?: string | null
  onUrlHandled?: () => void
}

export function Profile({ sharedUrl, onUrlHandled }: ProfileProps) {
  const { currentUser } = useAuth()
  const { posts, loading: postsLoading } = useUserPosts(currentUser?.uid || '')
  const { profile: tribeProfile } = useTribeProfile()

  // If sharedUrl is present, switch to cookbook tab
  const [activeTab, setActiveTab] = useState('cookbook')

  useEffect(() => {
    if (sharedUrl) {
      setActiveTab('cookbook')
    }
  }, [sharedUrl])

  if (!currentUser) return <div>Please sign in</div>

  return (
    <div className="w-full pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted/50 p-1 mx-4" style={{ width: 'calc(100% - 32px)' }}>
          <TabsTrigger value="cookbook" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Cookbook
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Photos
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cookbook" className="mt-0 focus-visible:outline-none">
          <RecipesPage
            sharedUrl={sharedUrl}
            onUrlHandled={onUrlHandled}
            hideHeader={true}
            className="min-h-[50vh] pb-0"
          />
        </TabsContent>

        <TabsContent value="photos" className="focus-visible:outline-none">
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Tribe Photos</CardTitle>
                    <CardDescription>Your shots shown to the tribe</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                    {(tribeProfile?.photoUrls?.length || 0)} Photos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Wild Shot */}
                  <div className="space-y-3">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted group border border-border/50 shadow-sm">
                      {tribeProfile?.photoUrls?.[0] ? (
                        <img
                          src={tribeProfile.photoUrls[0]}
                          alt="Wild Shot"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                          <Camera size={32} className="mb-2 opacity-50" />
                          <span className="text-xs font-medium">Add Wild Shot</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center text-muted-foreground">Wild Shot</p>
                  </div>

                  {/* Chef Shot */}
                  <div className="space-y-3">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted group border border-border/50 shadow-sm">
                      {tribeProfile?.photoUrls?.[1] ? (
                        <img
                          src={tribeProfile.photoUrls[1]}
                          alt="Chef Shot"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                          <ImageSquare size={32} className="mb-2 opacity-50" />
                          <span className="text-xs font-medium">Add Chef Shot</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center text-muted-foreground">Chef Shot</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="focus-visible:outline-none">
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-border/50 shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={post.userPhotoUrl} />
                    <AvatarFallback>{post.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{post.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="aspect-square bg-muted relative">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                      <Heart size={20} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <ChatCircle size={20} />
                      <span className="text-sm font-medium">{post.commentCount}</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {post.recipeName && (
                      <p className="font-medium text-sm">
                        Cooked <span className="text-primary">{post.recipeName}</span>
                      </p>
                    )}
                    {post.caption && (
                      <p className="text-sm text-foreground/90">{post.caption}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      {post.recipeCategory && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {post.recipeCategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {posts.length === 0 && !postsLoading && (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                <p>No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
