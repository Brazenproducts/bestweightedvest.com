# Affiliate Site Rules - TacticalSeats.com

## Content Standards

### Post Structure
- **Minimum length:** 2,500 words (11-13 min read)
- **Format:** Problem→Solution→Comparison→Recommendations→FAQ pattern
- **Meta description:** Under 160 characters, compelling value proposition
- **Headings:** H1 title, H2 for major sections, H3 for subsections

### Product Recommendations
- Always compare at least 3-5 options
- Include price ranges and value propositions
- Feature comparison tables when covering multiple products
- Real-world use cases and wear patterns
- Link to Amazon Associates and Bartact affiliates where applicable
- Disclosure: "As an Amazon Associate, we earn commissions on qualifying purchases" at bottom

### Content Focus
- Tactical/MOLLE features prominently featured
- Emphasis on durability, real-world performance, not aesthetics
- Contractor/professional use cases prioritized
- Vehicle-specific buying guides (trim, year, seating configs)
- Material science: Cordura vs neoprene vs canvas vs polyester
- Installation and compatibility information

### SEO Targeting
- Target long-tail keywords: "best seat covers for [vehicle] [year]"
- Include comparison terms: "vs" posts on brand/material matchups
- Vehicle-specific content with year ranges and trim levels
- Seasonal guides: summer protection, winter/salt/mud preparation
- Problem-solution: "Best for contractors," "For hunting dogs," etc.

## Technical Requirements

### HTML Structure
- Use semantic HTML5 (nav, article, sections)
- No images required (posts work text-only)
- Internal linking to related guides
- Responsive design (tested on mobile)
- Dark theme: #1a1a1a background, #e0e0e0 text, #E8600A accent

### Blog Index Updates
- Add new post card to top of "Latest Posts" section
- Card format: date + title + description + "Read →"
- Update read time estimate (typically 11-13 min for full posts)
- Keep most recent posts visible above the fold

### Metadata
- Title tag: 50-60 characters, includes site name
- Meta description: 150-160 characters
- Date format: "Month DD, YYYY · NN min read"
- Slug format: kebab-case, descriptive (e.g., best-seat-covers-fall-winter.html)

## Publishing Workflow

1. Write content in blog post template HTML
2. Match existing CSS and styling exactly
3. Add post card to blog/index.html (insert at top, inside blog-grid div)
4. Verify links (internal and affiliate)
5. Commit: "Publish: [Post Title] (Date)"
6. Push to main branch
7. Submit to IndexNow for immediate indexing
8. Update memory/tacticalseats-blog-calendar.md with published date

## Affiliate Compliance

- Amazon Associates: Link format should use clean affiliate ID
- Bartact: Direct product links with affiliate tracking
- No sponsored content notation needed (natural recommendations only)
- Never recommend products we haven't researched or don't make sense
- Price ranges and availability subject to change (ok to note this)

## Calendar Management

Posts must be queued in memory/tacticalseats-blog-calendar.md with:
- Sequential post number
- Title
- Target publish date (can be approximate)
- Publish status and actual date when complete

## Restrictions

- No political content or controversial topics
- No low-quality AI-generated content (must be researched and written thoughtfully)
- Avoid thin content or duplicate Google results
- No keyword stuffing or black-hat SEO
- Each post must provide genuine value to tactical vehicle owner community
