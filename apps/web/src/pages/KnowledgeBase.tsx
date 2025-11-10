import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Search,
  PlayCircleOutline,
  Code,
  HelpOutline,
  ArrowForward,
  AssignmentTurnedIn,
  AutoGraph,
  Security,
  SupportAgent,
  Storefront,
  LocalShipping,
  PeopleAlt,
  Insights,
  RocketLaunch,
  Tune,
  ShieldOutlined,
  Timeline,
} from '@mui/icons-material';
import {
  Package,
  Store,
  Truck,
  Smartphone,
  CreditCard,
  Settings,
  FileText,
} from 'lucide-react';

const ROLE_KEYS = ['merchant', 'courier', 'consumer', 'admin'] as const;
type RoleKey = typeof ROLE_KEYS[number];

interface RoleHighlight {
  label: string;
  value: string;
}

interface RolePrimaryAction {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
}

interface RoleSectionCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
}

interface RoleSection {
  title: string;
  description: string;
  cards: RoleSectionCard[];
}

interface RoleResource {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

interface RoleContent {
  role: RoleKey;
  heroTitle: string;
  heroSubtitle: string;
  gradient: string;
  highlights: RoleHighlight[];
  primaryActions: RolePrimaryAction[];
  sections: RoleSection[];
  resources: RoleResource[];
}

const ROLE_CONTENT: Record<RoleKey, RoleContent> = {
  merchant: {
    role: 'merchant',
    heroTitle: 'Merchant Playbooks',
    heroSubtitle:
      'Launch dynamic checkout experiences, connect your couriers, and deliver on time in every market.',
    gradient: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
    highlights: [
      { label: 'Checkout launch time', value: '12 min' },
      { label: 'Guided workflows', value: '35 playbooks' },
      { label: 'Conversion uplift', value: '+24%' },
    ],
    primaryActions: [
      {
        label: 'Checkout Setup Wizard',
        description: 'Configure courier weighting, pricing rules, and UI in one guided flow.',
        href: '/knowledge-base?article=merchant-checkout-setup',
        icon: <AssignmentTurnedIn sx={{ fontSize: 28, color: '#1e3a8a' }} />,
        accent: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(129,140,248,0.1))',
      },
      {
        label: 'Performance Analytics Playbook',
        description: 'Benchmark courier trust scores and monitor fulfilment KPIs in real time.',
        href: '/knowledge-base?article=merchant-analytics-playbook',
        icon: <Insights sx={{ fontSize: 28, color: '#7c3aed' }} />,
        accent: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(99,102,241,0.1))',
      },
    ],
    sections: [
      {
        title: 'Launch & Configuration',
        description: 'Everything you need to go live with confidence.',
        cards: [
          {
            title: 'Dynamic Checkout Guide',
            description: 'Postal-code weighting, fallback logic, and branding checklists.',
            href: '/knowledge-base?article=dynamic-checkout-guide',
            icon: <Tune sx={{ fontSize: 26, color: '#3730a3' }} />,
            accent: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(67,56,202,0.08))',
          },
          {
            title: 'Courier Selection Matrix',
            description: 'Compare price, SLA, and trust score to pick the best operators per market.',
            href: '/knowledge-base?article=courier-selection-matrix',
            icon: <LocalShipping sx={{ fontSize: 26, color: '#2563eb' }} />,
            accent: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.08))',
          },
        ],
      },
      {
        title: 'Operations & Growth',
        description: 'Scale fulfilment, automate returns, and fuel retention.',
        cards: [
          {
            title: 'Post-purchase Automation',
            description: 'Trigger notifications, loyalty programs, and NPS flows automatically.',
            href: '/knowledge-base?article=post-purchase-automation',
            icon: <RocketLaunch sx={{ fontSize: 26, color: '#f97316' }} />,
            accent: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(251,146,60,0.1))',
          },
          {
            title: 'Returns & Claims Framework',
            description: 'Standard operating procedures for claims, refunds, and RMA routing.',
            href: '/knowledge-base?article=returns-claims-framework',
            icon: <ShieldOutlined sx={{ fontSize: 26, color: '#0f766e' }} />,
            accent: 'linear-gradient(135deg, rgba(15,118,110,0.18), rgba(45,212,191,0.1))',
          },
        ],
      },
    ],
    resources: [
      {
        label: 'Merchant API Reference',
        description: 'Endpoints for checkout rules, orders, analytics, and webhooks.',
        href: '/knowledge-base?article=merchant-api-reference',
        icon: <Code sx={{ fontSize: 24, color: '#3730a3' }} />,
      },
      {
        label: 'Shopify Plugin Checklist',
        description: 'Verify OAuth scopes, test webhooks, and prepare for app review.',
        href: '/knowledge-base?article=shopify-plugin-checklist',
        icon: <AssignmentTurnedIn sx={{ fontSize: 24, color: '#7c3aed' }} />,
      },
      {
        label: 'Merchant Success Desk',
        description: 'Book a working session with our merchant success engineers.',
        href: '/knowledge-base?article=merchant-support',
        icon: <SupportAgent sx={{ fontSize: 24, color: '#0f766e' }} />,
      },
    ],
  },
  courier: {
    role: 'courier',
    heroTitle: 'Courier Operations Hub',
    heroSubtitle:
      'Monitor performance, automate ETA updates, and grow marketplace bookings with data-backed insights.',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    highlights: [
      { label: 'Live performance monitors', value: '14 dashboards' },
      { label: 'Average ETA accuracy', value: '96%' },
      { label: 'Marketplace leads', value: '+38% QoQ' },
    ],
    primaryActions: [
      {
        label: 'Courier Onboarding Checklist',
        description: 'API credentials, webhook verification, and SLA baselines.',
        href: '/knowledge-base?article=courier-onboarding-checklist',
        icon: <AssignmentTurnedIn sx={{ fontSize: 28, color: '#0c4a6e' }} />,
        accent: 'linear-gradient(135deg, rgba(14,165,233,0.16), rgba(14,116,144,0.1))',
      },
      {
        label: 'Performance Dashboard Walkthrough',
        description: 'Interpret trust score, cost-to-serve, and SLA variance charts.',
        href: '/knowledge-base?article=courier-dashboard-walkthrough',
        icon: <AutoGraph sx={{ fontSize: 28, color: '#1d4ed8' }} />,
        accent: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.1))',
      },
    ],
    sections: [
      {
        title: 'Operations Control Tower',
        description: 'Keep promises, prevent delays, and manage incidents.',
        cards: [
          {
            title: 'ETA Accuracy Toolkit',
            description: 'Best practices for hourly ETA refreshes and exception handling.',
            href: '/knowledge-base?article=eta-accuracy-toolkit',
            icon: <Timeline sx={{ fontSize: 26, color: '#0ea5e9' }} />,
            accent: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(14,165,233,0.1))',
          },
          {
            title: 'Incident Playbooks',
            description: 'Templates for lost parcels, weather delays, and claim escalations.',
            href: '/knowledge-base?article=courier-incident-playbook',
            icon: <Security sx={{ fontSize: 26, color: '#0369a1' }} />,
            accent: 'linear-gradient(135deg, rgba(3,105,161,0.18), rgba(2,132,199,0.1))',
          },
        ],
      },
      {
        title: 'Marketplace Growth',
        description: 'Win more bookings and maintain premium placement.',
        cards: [
          {
            title: 'Lead Response Playbook',
            description: 'Recommended SLAs, pricing templates, and win/loss tracking.',
            href: '/knowledge-base?article=courier-lead-playbook',
            icon: <PeopleAlt sx={{ fontSize: 26, color: '#1e3a8a' }} />,
            accent: 'linear-gradient(135deg, rgba(30,58,138,0.16), rgba(59,130,246,0.08))',
          },
          {
            title: 'Trust Score Optimisation',
            description: 'Improve reviews, NPS, and SLA adherence to climb the rankings.',
            href: '/knowledge-base?article=courier-trust-score',
            icon: <Insights sx={{ fontSize: 26, color: '#fb7185' }} />,
            accent: 'linear-gradient(135deg, rgba(251,113,133,0.18), rgba(248,113,113,0.08))',
          },
        ],
      },
    ],
    resources: [
      {
        label: 'Courier API Reference',
        description: 'Create bookings, update statuses, and push ETA updates.',
        href: '/knowledge-base?article=courier-api-reference',
        icon: <Code sx={{ fontSize: 24, color: '#0f172a' }} />,
      },
      {
        label: 'Webhook Validation Guide',
        description: 'Secure your callbacks and sign payloads with Supabase functions.',
        href: '/knowledge-base?article=courier-webhook-validation',
        icon: <Security sx={{ fontSize: 24, color: '#1d4ed8' }} />,
      },
      {
        label: 'Courier Success Desk',
        description: 'Schedule a session with operations coaching specialists.',
        href: '/knowledge-base?article=courier-support',
        icon: <SupportAgent sx={{ fontSize: 24, color: '#0c4a6e' }} />,
      },
    ],
  },
  consumer: {
    role: 'consumer',
    heroTitle: 'Consumer Help Centre',
    heroSubtitle: 'Track parcels, manage returns, and resolve delivery issues—no login required.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #6366f1 100%)',
    highlights: [
      { label: 'Active tracking updates', value: 'Real time' },
      { label: 'Resolution satisfaction', value: '4.8 / 5' },
      { label: 'Return scenarios covered', value: '18 guides' },
    ],
    primaryActions: [
      {
        label: 'Track a Parcel',
        description: 'Use your tracking number to view live status and ETA.',
        href: '/track',
        icon: <Timeline sx={{ fontSize: 28, color: '#db2777' }} />,
        accent: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(236,72,153,0.08))',
      },
      {
        label: 'Start a Return',
        description: 'Generate labels, book drop-offs, and follow the return journey.',
        href: '/knowledge-base?article=consumer-returns',
        icon: <AssignmentTurnedIn sx={{ fontSize: 28, color: '#7c3aed' }} />,
        accent: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(129,140,248,0.08))',
      },
    ],
    sections: [
      {
        title: 'Stay Informed',
        description: 'Understand every stage of your delivery experience.',
        cards: [
          {
            title: 'Tracking Status Glossary',
            description: 'Learn what each tracking event means and when to act.',
            href: '/knowledge-base?article=tracking-status-glossary',
            icon: <Insights sx={{ fontSize: 26, color: '#be123c' }} />,
            accent: 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(248,113,113,0.08))',
          },
          {
            title: 'Delivery Preferences',
            description: 'Request safe-place delivery, reschedule, or change address.',
            href: '/knowledge-base?article=delivery-preferences',
            icon: <Tune sx={{ fontSize: 26, color: '#7c3aed' }} />,
            accent: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(129,140,248,0.1))',
          },
        ],
      },
      {
        title: 'Resolve an Issue',
        description: 'Everything you need to file claims or request support fast.',
        cards: [
          {
            title: 'Late Delivery Playbook',
            description: 'Steps to escalate a delay and request compensation if applicable.',
            href: '/knowledge-base?article=late-delivery-playbook',
            icon: <Security sx={{ fontSize: 26, color: '#2563eb' }} />,
            accent: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.08))',
          },
          {
            title: 'Damaged Parcel Guide',
            description: 'Upload evidence, submit claims, and track resolution status.',
            href: '/knowledge-base?article=damaged-parcel-guide',
            icon: <ShieldOutlined sx={{ fontSize: 26, color: '#1d4ed8' }} />,
            accent: 'linear-gradient(135deg, rgba(29,78,216,0.18), rgba(96,165,250,0.08))',
          },
        ],
      },
    ],
    resources: [
      {
        label: 'Self-Service Portal',
        description: 'Access labels, QR codes, and chat support from any device.',
        href: '/knowledge-base?article=consumer-portal',
        icon: <Storefront sx={{ fontSize: 24, color: '#7c3aed' }} />,
      },
      {
        label: 'Returns FAQs',
        description: 'Common questions about refunds, exchanges, and replacements.',
        href: '/knowledge-base?article=returns-faq',
        icon: <AssignmentTurnedIn sx={{ fontSize: 24, color: '#db2777' }} />,
      },
      {
        label: 'Live Support',
        description: 'Chat with a support specialist for urgent delivery issues.',
        href: '/knowledge-base?article=consumer-support',
        icon: <SupportAgent sx={{ fontSize: 24, color: '#2563eb' }} />,
      },
    ],
  },
  admin: {
    role: 'admin',
    heroTitle: 'Platform Administration',
    heroSubtitle: 'Monitor compliance, secure access, and keep the entire ecosystem aligned.',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    highlights: [
      { label: 'RLS policies deployed', value: '107' },
      { label: 'Audit automations', value: '52 checkpoints' },
      { label: 'Incidents resolved', value: '99.2% < 15 min' },
    ],
    primaryActions: [
      {
        label: 'Security & Access Review',
        description: 'Audit roles, RLS policies, and Supabase permissions in minutes.',
        href: '/knowledge-base?article=admin-security-review',
        icon: <Security sx={{ fontSize: 28, color: '#38bdf8' }} />,
        accent: 'linear-gradient(135deg, rgba(14,165,233,0.16), rgba(56,189,248,0.1))',
      },
      {
        label: 'Incident Response Playbook',
        description: 'Follow the 4-step escalation path for critical platform issues.',
        href: '/knowledge-base?article=incident-response-playbook',
        icon: <AssignmentTurnedIn sx={{ fontSize: 28, color: '#facc15' }} />,
        accent: 'linear-gradient(135deg, rgba(250,204,21,0.18), rgba(250,204,21,0.08))',
      },
    ],
    sections: [
      {
        title: 'Governance & Compliance',
        description: 'Protect data, enforce policies, and stay audit ready.',
        cards: [
          {
            title: 'Spec-Driven Framework Enforcement',
            description: 'Run the duplicate checks and weekly audit workflows end-to-end.',
            href: '/knowledge-base?article=spec-driven-enforcement',
            icon: <AssignmentTurnedIn sx={{ fontSize: 26, color: '#6366f1' }} />,
            accent: 'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.08))',
          },
          {
            title: 'Database Compliance Dashboard',
            description: 'Validate schemas, RLS policies, and Supabase migrations before release.',
            href: '/knowledge-base?article=database-compliance-dashboard',
            icon: <ShieldOutlined sx={{ fontSize: 26, color: '#22d3ee' }} />,
            accent: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(14,165,233,0.08))',
          },
        ],
      },
      {
        title: 'Platform Operations',
        description: 'Coordinate deployments, observability, and executive reporting.',
        cards: [
          {
            title: 'Release Management Runbook',
            description: 'Checklist for Vercel deployments, feature flags, and rollback plans.',
            href: '/knowledge-base?article=release-management-runbook',
            icon: <RocketLaunch sx={{ fontSize: 26, color: '#38bdf8' }} />,
            accent: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(37,99,235,0.08))',
          },
          {
            title: 'Executive Reporting Suite',
            description: 'Generate weekly health reports across merchants, couriers, and consumers.',
            href: '/knowledge-base?article=executive-reporting-suite',
            icon: <PeopleAlt sx={{ fontSize: 26, color: '#facc15' }} />,
            accent: 'linear-gradient(135deg, rgba(250,204,21,0.16), rgba(252,211,77,0.08))',
          },
        ],
      },
    ],
    resources: [
      {
        label: 'Admin API Surface',
        description: 'Endpoints for user impersonation, audit logs, and configuration exports.',
        href: '/knowledge-base?article=admin-api-surface',
        icon: <Code sx={{ fontSize: 24, color: '#38bdf8' }} />,
      },
      {
        label: 'Compliance Calendar',
        description: 'Quarterly certification checks and policy renewal reminders.',
        href: '/knowledge-base?article=compliance-calendar',
        icon: <Timeline sx={{ fontSize: 24, color: '#facc15' }} />,
      },
      {
        label: 'Administrator Hotline',
        description: 'Reach the on-call platform administrator for critical incidents.',
        href: '/knowledge-base?article=admin-support',
        icon: <SupportAgent sx={{ fontSize: 24, color: '#38bdf8' }} />,
      },
    ],
  },
};

const isRoleKey = (value: string): value is RoleKey => ROLE_KEYS.includes(value as RoleKey);

const gradientBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const CATEGORY_CONFIG = [
  {
    icon: Package,
    title: 'Getting Started',
    description: 'Learn the basics and set up your account',
    articles: 12,
    accent: '#667eea',
    navigateTo: '/knowledge-base/getting-started',
  },
  {
    icon: Store,
    title: 'For Merchants',
    description: 'E-commerce integration and shipping guides',
    articles: 18,
    accent: '#764ba2',
    navigateTo: '/knowledge-base/for-merchants',
  },
  {
    icon: Truck,
    title: 'For Couriers',
    description: 'Fleet management and delivery optimization',
    articles: 15,
    accent: '#22c55e',
    navigateTo: '/knowledge-base/for-couriers',
  },
  {
    icon: Smartphone,
    title: 'Mobile Apps',
    description: 'iOS and Android app guides',
    articles: 10,
    accent: '#6366f1',
    navigateTo: '/knowledge-base/mobile-apps',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Payment methods and billing',
    articles: 8,
    accent: '#fbbf24',
    navigateTo: '/knowledge-base/payments',
  },
  {
    icon: Settings,
    title: 'API & Integrations',
    description: 'Developer documentation and plugins',
    articles: 20,
    accent: '#ec4899',
    navigateTo: '/knowledge-base/api-integrations',
  },
];

const POPULAR_ARTICLES = [
  {
    title: 'How to install the WooCommerce plugin',
    category: 'For Merchants',
    readTime: '5 min read',
  },
  {
    title: 'Setting up Vipps payments in Norway',
    category: 'Payments',
    readTime: '3 min read',
  },
  {
    title: 'Real-time tracking: A complete guide',
    category: 'Getting Started',
    readTime: '7 min read',
  },
  {
    title: 'Optimizing delivery routes for maximum efficiency',
    category: 'For Couriers',
    readTime: '10 min read',
  },
  {
    title: 'Using the mobile app for C2C shipping',
    category: 'Mobile Apps',
    readTime: '4 min read',
  },
  {
    title: 'API authentication and security',
    category: 'API & Integrations',
    readTime: '8 min read',
  },
];

const RESOURCE_CARDS = [
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides for common tasks',
    action: 'Watch Videos',
    icon: <PlayCircleOutline fontSize="large" color="primary" />,
    gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12))',
  },
  {
    title: 'API Documentation',
    description: 'Complete API reference for developers',
    action: 'View API Docs',
    icon: <Code fontSize="large" color="secondary" />,
    gradient: 'linear-gradient(135deg, rgba(118, 75, 162, 0.12), rgba(236, 72, 153, 0.12))',
  },
  {
    title: 'Contact Support',
    description: "Can't find what you're looking for? We're here to help",
    action: 'Get Support',
    icon: <HelpOutline fontSize="large" sx={{ color: '#22c55e' }} />,
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.12))',
  },
];

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const roleParam = (searchParams.get('role') || '').toLowerCase();
  const roleContent = isRoleKey(roleParam) ? ROLE_CONTENT[roleParam] : undefined;

  const goTo = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener');
    } else {
      navigate(href);
    }
  };

  if (roleContent) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box
          sx={{
            background: roleContent.gradient,
            color: 'white',
            pt: { xs: 10, md: 14 },
            pb: { xs: 8, md: 12 },
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={6}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowForward sx={{ transform: 'rotate(180deg)' }} />}
                  onClick={() => navigate('/knowledge-base')}
                  sx={{ textTransform: 'none', opacity: 0.8 }}
                >
                  Back to overview
                </Button>
                <Chip label={`${roleContent.heroTitle}`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }} />
              </Stack>

              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack spacing={3}>
                    <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                      {roleContent.heroTitle}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 620 }}>
                      {roleContent.heroSubtitle}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={{ mt: 2 }}>
                      {roleContent.highlights.map((highlight) => (
                        <Paper
                          key={highlight.label}
                          elevation={0}
                          sx={{
                            px: 3,
                            py: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            minWidth: 180,
                          }}
                        >
                          <Typography variant="h5" fontWeight={700}>
                            {highlight.value}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {highlight.label}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Grid container spacing={3}>
                    {roleContent.primaryActions.map((action) => (
                      <Grid item xs={12} key={action.label}>
                        <Paper
                          onClick={() => goTo(action.href)}
                          sx={{
                            cursor: 'pointer',
                            p: 3,
                            borderRadius: 3,
                            background: action.accent,
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 18px 40px rgba(15,23,42,0.22)',
                            },
                          }}
                        >
                          <Stack spacing={2}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {action.icon}
                            </Box>
                            <Stack spacing={1}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {action.label}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                {action.description}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Stack spacing={8}>
            {roleContent.sections.map((section) => (
              <Box key={section.title}>
                <Stack spacing={3} sx={{ mb: 4 }}>
                  <Typography variant="overline" color="primary" fontWeight={700}>
                    {section.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {section.description}
                  </Typography>
                </Stack>
                <Grid container spacing={3}>
                  {section.cards.map((card) => (
                    <Grid item xs={12} md={6} key={card.title}>
                      <Paper
                        onClick={() => goTo(card.href)}
                        sx={{
                          cursor: 'pointer',
                          height: '100%',
                          borderRadius: 3,
                          p: 3,
                          background: card.accent,
                          border: '1px solid rgba(15,23,42,0.08)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: '0 18px 38px rgba(15,23,42,0.15)',
                          },
                        }}
                      >
                        <Stack spacing={2.5}>
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: 2,
                              bgcolor: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 10px 24px rgba(15,23,42,0.12)',
                            }}
                          >
                            {card.icon}
                          </Box>
                          <Stack spacing={1.5}>
                            <Typography variant="h6" fontWeight={700} color="text.primary">
                              {card.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {card.description}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}

            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ mb: 2 }}>
                Resources
              </Typography>
              <Grid container spacing={3}>
                {roleContent.resources.map((resource) => (
                  <Grid item xs={12} md={4} key={resource.label}>
                    <Paper
                      variant="outlined"
                      onClick={() => goTo(resource.href)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        borderRadius: 3,
                        p: 3,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
                        },
                      }}
                    >
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'rgba(59,130,246,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {resource.icon}
                        </Box>
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {resource.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {resource.description}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  const handleCategoryNavigate = (path: string) => {
    navigate(path);
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_ARTICLES;
    }

    return POPULAR_ARTICLES.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: gradientBg,
          color: 'white',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={6} alignItems="center">
            <Stack spacing={2} alignItems="center" textAlign="center" maxWidth={720}>
              <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                Knowledge Base
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.85 }}>
                Find walkthroughs, tutorials, and best practices tailored to every Performile role.
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: 560,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, guides, or topics..."
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    py: 1.8,
                    fontSize: 18,
                    color: 'white',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.7)',
                  },
                }}
              />
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack spacing={3} sx={{ mb: 6 }}>
          <Chip label="Browse by Category" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Find answers faster
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={640}>
            We organize guides by role so you can jump directly to the workflows and tutorials that matter most to your team.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {CATEGORY_CONFIG.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.title}>
              <Card
                onClick={() => handleCategoryNavigate(category.navigateTo)}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0px 12px 30px rgba(2, 12, 50, 0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0px 18px 40px rgba(102, 126, 234, 0.18)',
                  },
                }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: category.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        transition: 'transform 0.2s ease',
                        '& svg': {
                          width: 28,
                          height: 28,
                        },
                      }}
                    >
                      <category.icon strokeWidth={1.6} />
                    </Box>
                    <Stack spacing={1}>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {category.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {category.articles} articles
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<span style={{ display: 'inline-flex', transform: 'translateX(2px)' }}>→</span>}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Explore
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Popular Articles */}
      <Box sx={{ bgcolor: 'white', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ mb: 4 }}>
            <Chip label="Popular" color="secondary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Trending tutorials
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={620}>
              These guides are a great place to start if you&apos;re new to Performile or rolling out new functionality to your team.
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Stack divider={<Divider flexItem />}>
              {filteredArticles.map((article, index) => (
                <Box
                  component="button"
                  key={`${article.title}-${index}`}
                  onClick={() => navigate(`/knowledge-base/article/${index}`)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 3,
                    py: 2.5,
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: 'rgba(102,126,234,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText className="h-5 w-5" color="rgba(102,126,234,1)" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                        {article.title}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75 }}>
                        <Typography variant="body2" color="text.secondary">
                          {article.category}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(102,126,234,0.2)' }} />
                        <Typography variant="body2" color="text.secondary">
                          {article.readTime}
                        </Typography>
                      </Stack>
                    </Box>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      Read →
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Resources */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Chip label="Resources" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Everything else you need
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600}>
            Dive deeper with walkthrough videos, API references, and 1:1 support from the Performile team.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {RESOURCE_CARDS.map((resource) => (
            <Grid item xs={12} md={4} key={resource.title}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  background: resource.gradient,
                  boxShadow: 'none',
                }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>{resource.icon}</Box>
                    <Stack spacing={1}>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {resource.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resource.description}
                      </Typography>
                    </Stack>
                    <Button
                      variant="text"
                      sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                      endIcon={<span style={{ display: 'inline-flex', transform: 'translateX(2px)' }}>→</span>}
                    >
                      {resource.action}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
