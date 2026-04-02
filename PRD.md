# Planning Guide

A personal digital cookbook for storing, organizing, and accessing your favorite recipes with ingredient lists and cooking instructions.

**Experience Qualities**:
1. **Intuitive** - Finding and adding recipes should feel natural and effortless, like flipping through a well-organized cookbook
2. **Warm** - The interface should evoke the comfort and joy of home cooking with inviting colors and generous spacing
3. **Focused** - Each recipe view should present information clearly without distraction, making cooking easier

**Complexity Level**: Light Application (multiple features with basic state)
  - The app manages recipe collections with create, read, update, and delete operations, uses persistent storage for user data, and includes search/filter capabilities

## Essential Features

### Recipe Creation
- **Functionality**: Form to input recipe name, description, ingredients, instructions, prep time, cook time, servings, and category
- **Purpose**: Allows users to build their personal recipe collection
- **Trigger**: Click "Add Recipe" button
- **Progression**: Click Add Recipe → Fill form fields → Add ingredients one-by-one → Add instruction steps → Save → View in collection
- **Success criteria**: Recipe persists between sessions and displays correctly in both list and detail views

### Recipe Viewing
- **Functionality**: Display full recipe with all details in an easy-to-read format
- **Purpose**: Provides clear reference while cooking
- **Trigger**: Click on recipe card from main list
- **Progression**: Browse recipe list → Click recipe → View full details with ingredients and instructions → Navigate back to list
- **Success criteria**: All recipe information is clearly visible and properly formatted for cooking reference

### Recipe Organization
- **Functionality**: Categorize recipes (Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks) and filter by category
- **Purpose**: Helps users quickly find recipes for specific meal types
- **Trigger**: Select category filter or assign category during recipe creation
- **Progression**: View all recipes → Click category filter → See filtered results → Click "All" to return
- **Success criteria**: Filtering works instantly and accurately shows only recipes in selected category

### Recipe Search
- **Functionality**: Real-time search by recipe name or ingredients
- **Purpose**: Quick access to specific recipes without scrolling
- **Trigger**: Type in search bar
- **Progression**: Click search → Type query → Results filter in real-time → Clear search to reset
- **Success criteria**: Search returns relevant results as user types, matching recipe names and ingredients

### Recipe Management
- **Functionality**: Edit existing recipes or delete unwanted ones
- **Purpose**: Keep recipe collection current and accurate
- **Trigger**: Click edit or delete buttons on recipe view
- **Progression**: View recipe → Click edit → Modify fields → Save changes OR View recipe → Click delete → Confirm → Recipe removed
- **Success criteria**: Changes persist immediately, delete requires confirmation to prevent accidents

## Edge Case Handling

- **Empty State**: Show welcoming message with prominent "Add Recipe" button when no recipes exist
- **Search No Results**: Display friendly message suggesting to clear search or add new recipe
- **Missing Images**: Use elegant placeholder with recipe initial or category icon
- **Long Ingredient Lists**: Scrollable area with clear visual separation between ingredients
- **Long Instructions**: Step-by-step numbered format with generous line spacing for readability
- **Form Validation**: Prevent saving recipes without required fields (name, at least one ingredient, at least one instruction)

## Design Direction

The design should feel warm, inviting, and homey - like a beautiful kitchen space where you love to cook. It should evoke comfort food and family recipes while remaining clean and modern. A minimal yet rich interface serves the purpose best, with thoughtful details like subtle shadows and smooth transitions that don't distract from the content.

## Color Selection

Custom palette - using warm, appetizing colors that evoke fresh ingredients and home cooking while maintaining excellent readability.

- **Primary Color**: Warm Terracotta (#C85A3C / oklch(0.58 0.12 35)) - Communicates warmth, comfort, and the earthy richness of home cooking
- **Secondary Colors**: Soft Sage (#8B9D83 / oklch(0.63 0.04 135)) for category badges and accents - represents fresh herbs and natural ingredients
- **Accent Color**: Honey Gold (#D4941F / oklch(0.68 0.13 75)) - Bright, appetizing highlight for CTAs and important actions
- **Foreground/Background Pairings**:
  - Background (Warm Cream #FFFCF7 / oklch(0.99 0.01 85)): Dark text (#2C1810 / oklch(0.18 0.02 35)) - Ratio 14.2:1 ✓
  - Card (Pure White #FFFFFF / oklch(1 0 0)): Dark text (#2C1810 / oklch(0.18 0.02 35)) - Ratio 15.8:1 ✓
  - Primary (Terracotta #C85A3C / oklch(0.58 0.12 35)): White text (#FFFFFF / oklch(1 0 0)) - Ratio 4.9:1 ✓
  - Secondary (Soft Sage #8B9D83 / oklch(0.63 0.04 135)): Dark text (#2C1810 / oklch(0.18 0.02 35)) - Ratio 7.2:1 ✓
  - Accent (Honey Gold #D4941F / oklch(0.68 0.13 75)): Dark text (#2C1810 / oklch(0.18 0.02 35)) - Ratio 6.8:1 ✓
  - Muted (Light Linen #F5F1E8 / oklch(0.95 0.01 85)): Muted text (#6B5D52 / oklch(0.42 0.02 55)) - Ratio 5.1:1 ✓

## Font Selection

Fonts should feel friendly and approachable while maintaining excellent readability for ingredient lists and instructions. Using Playfair Display for recipe titles to add elegance and warmth, paired with Inter for clean, highly-legible body text.

- **Typographic Hierarchy**:
  - H1 (App Title): Playfair Display SemiBold/32px/tight leading - elegant and inviting
  - H2 (Recipe Name): Playfair Display SemiBold/28px/tight leading - makes each recipe feel special
  - H3 (Section Headers): Inter SemiBold/18px/normal leading - clear organization
  - Body (Ingredients/Instructions): Inter Regular/16px/relaxed leading (1.6) - optimal readability while cooking
  - Small (Times/Servings): Inter Medium/14px/normal leading - clear but unobtrusive
  - Button Text: Inter SemiBold/15px/normal leading - confident and clickable

## Animations

Animations should be subtle and purposeful - gentle enough to not distract while cooking, but present enough to provide satisfying feedback and guide attention to recipe additions and state changes.

- **Purposeful Meaning**: Smooth page transitions and card hover states communicate interactivity; ingredient/instruction additions feel additive and constructive
- **Hierarchy of Movement**: Recipe cards get gentle lift on hover; form submissions use satisfying scale animations; category filters slide smoothly; recipe details fade in gracefully

## Component Selection

- **Components**: 
  - Dialog for recipe create/edit forms (full-screen on mobile, modal on desktop)
  - Card for recipe list items with hover states
  - Button with primary/secondary/ghost variants for different action hierarchies
  - Input and Textarea for form fields
  - Badge for category tags with soft colors
  - ScrollArea for long ingredient/instruction lists
  - AlertDialog for delete confirmations
  - Separator for visual section breaks
  - Tabs for potential future category organization
  - Utilize shadcn's card with subtle shadow and border-radius matching --radius

- **Customizations**: 
  - Custom recipe card component with image placeholder area
  - Custom ingredient/instruction list builder with add/remove controls
  - Custom empty state illustration or icon
  - Time input displays with clock icons from Phosphor

- **States**: 
  - Buttons: Default with subtle shadow, hover with lift effect, active with scale-down, disabled with reduced opacity
  - Input fields: Default with light border, focus with primary color ring and subtle scale, error with destructive color
  - Recipe cards: Default with subtle shadow, hover with elevated shadow and slight scale, active/selected with primary border

- **Icon Selection**: 
  - Plus for adding recipes, ingredients, instructions
  - MagnifyingGlass for search
  - Pencil for edit actions
  - Trash for delete actions
  - Clock for time indicators
  - CookingPot or ForkKnife for recipe/food related icons
  - X for closing dialogs and removing list items
  - Funnel or FunnelSimple for category filtering

- **Spacing**: 
  - Container padding: p-6 on desktop, p-4 on mobile
  - Card spacing: gap-4 for grid layouts
  - Form fields: space-y-4 for vertical stacking
  - Section spacing: space-y-6 for major sections
  - List items: space-y-2 for ingredients/instructions

- **Mobile**: 
  - Mobile-first grid: 1 column on mobile, 2 columns on tablet (md:), 3 columns on desktop (lg:)
  - Recipe dialog becomes full-screen sheet on mobile
  - Search bar stacks above filters on mobile
  - Larger touch targets (min 44px) for all interactive elements
  - Bottom-aligned primary action button on mobile for thumb accessibility
