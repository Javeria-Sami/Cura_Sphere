import { useState } from "react";
import {
  Search,
  Mail,
  CheckCircle,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Settings,
  ChevronRight,
  User,
  Phone
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Spinner } from "../ui/Spinner";
import { Skeleton } from "../ui/Skeleton";

export function DesignSystemPlayground() {
  const [activeTab, setActiveTab] = useState<"colors" | "buttons" | "badges" | "cards" | "inputs" | "feedback">("colors");
  const [demoInput, setDemoInput] = useState("");
  const [demoErrorInput, setDemoErrorInput] = useState("john.doe@example");
  const [btnLoading, setBtnLoading] = useState(false);

  const tabs = [
    { id: "colors", label: "Colors & Tokens", icon: <Layers size={16} /> },
    { id: "buttons", label: "Buttons & States", icon: <Sparkles size={16} /> },
    { id: "badges", label: "Status Badges", icon: <CheckCircle size={16} /> },
    { id: "cards", label: "Cards & Surfaces", icon: <ChevronRight size={16} /> },
    { id: "inputs", label: "Inputs & Forms", icon: <Mail size={16} /> },
    { id: "feedback", label: "Loading & Skeleton", icon: <Settings size={16} /> },
  ] as const;

  const triggerBtnLoading = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 2000);
  };

  return (
    <div className="min-height-screen bg-background animate-fade-in pb-16">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white py-12 px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-primary-400 mb-2">
              <Sparkles size={20} className="animate-pulse" />
              <span className="text-xs uppercase tracking-wider font-semibold">CuraSphere Design System</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Figma Tokens & Core UI Components</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl">
              CuraSphere HMS modular design token implementation. Fully responsive, calm, clinical, and information-dense aesthetics.
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="primary" pill size="md" className="bg-primary-950/80 border-primary-500/30 text-primary-300">
              V1.0 Baseline
            </Badge>
            <Badge variant="success" pill size="md" className="bg-success-950/80 border-success-500/30 text-success-300">
              Active Build
            </Badge>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto flex gap-1 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shrink-0
                ${
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Showcase Content Area */}
      <main className="max-w-6xl mx-auto px-6 mt-8 animate-slide-up">
        {/* TAB 1: COLORS & TOKENS */}
        {activeTab === "colors" && (
          <div className="space-y-8">
            <Card variant="glass">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Palette Definitions</h2>
              <p className="text-slate-500 text-xs mb-6">
                Core color swatches mapped from custom CSS variables inside <code>index.css</code>. Every shade supports layout contrast and status indications.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Brand Primary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Primary Theme (Blue)</h3>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="bg-primary px-4 py-6 text-white flex justify-between items-end">
                      <span className="text-sm font-bold">Primary Base</span>
                      <span className="text-xs">#2563EB</span>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-600">
                      <div className="bg-primary-50 py-2">50</div>
                      <div className="bg-primary-100 py-2">100</div>
                      <div className="bg-primary-200 py-2">200</div>
                      <div className="bg-primary-300 py-2 text-slate-800">300</div>
                      <div className="bg-primary-400 py-2 text-slate-800">400</div>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-100">
                      <div className="bg-primary-500 py-2">500</div>
                      <div className="bg-primary-600 py-2">600</div>
                      <div className="bg-primary-700 py-2">700</div>
                      <div className="bg-primary-800 py-2">800</div>
                      <div className="bg-primary-900 py-2">900</div>
                    </div>
                  </div>
                </div>

                {/* Success */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Success Status (Green)</h3>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="bg-success px-4 py-6 text-white flex justify-between items-end">
                      <span className="text-sm font-bold">Success Base</span>
                      <span className="text-xs">#16A34A</span>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-600">
                      <div className="bg-success-50 py-2">50</div>
                      <div className="bg-success-100 py-2">100</div>
                      <div className="bg-success-200 py-2">200</div>
                      <div className="bg-success-300 py-2 text-slate-800">300</div>
                      <div className="bg-success-400 py-2 text-slate-800">400</div>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-100">
                      <div className="bg-success-500 py-2">500</div>
                      <div className="bg-success-600 py-2">600</div>
                      <div className="bg-success-700 py-2">700</div>
                      <div className="bg-success-800 py-2">800</div>
                      <div className="bg-success-900 py-2">900</div>
                    </div>
                  </div>
                </div>

                {/* Danger */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Danger Status (Red)</h3>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="bg-danger px-4 py-6 text-white flex justify-between items-end">
                      <span className="text-sm font-bold">Danger Base</span>
                      <span className="text-xs">#DC2626</span>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-600">
                      <div className="bg-danger-50 py-2">50</div>
                      <div className="bg-danger-100 py-2">100</div>
                      <div className="bg-danger-200 py-2">200</div>
                      <div className="bg-danger-300 py-2 text-slate-800">300</div>
                      <div className="bg-danger-400 py-2 text-slate-800">400</div>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-100">
                      <div className="bg-danger-500 py-2">500</div>
                      <div className="bg-danger-600 py-2">600</div>
                      <div className="bg-danger-700 py-2">700</div>
                      <div className="bg-danger-800 py-2">800</div>
                      <div className="bg-danger-900 py-2">900</div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Warning Status (Amber)</h3>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="bg-warning px-4 py-6 text-white flex justify-between items-end">
                      <span className="text-sm font-bold">Warning Base</span>
                      <span className="text-xs">#D97706</span>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-600">
                      <div className="bg-warning-50 py-2">50</div>
                      <div className="bg-warning-100 py-2">100</div>
                      <div className="bg-warning-200 py-2">200</div>
                      <div className="bg-warning-300 py-2 text-slate-800">300</div>
                      <div className="bg-warning-400 py-2 text-slate-800">400</div>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-100">
                      <div className="bg-warning-500 py-2">500</div>
                      <div className="bg-warning-600 py-2">600</div>
                      <div className="bg-warning-700 py-2">700</div>
                      <div className="bg-warning-800 py-2">800</div>
                      <div className="bg-warning-900 py-2">900</div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Info Status (Cyan)</h3>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="bg-info px-4 py-6 text-white flex justify-between items-end">
                      <span className="text-sm font-bold">Info Base</span>
                      <span className="text-xs">#0891B2</span>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-600">
                      <div className="bg-info-50 py-2">50</div>
                      <div className="bg-info-100 py-2">100</div>
                      <div className="bg-info-200 py-2">200</div>
                      <div className="bg-info-300 py-2 text-slate-800">300</div>
                      <div className="bg-info-400 py-2 text-slate-800">400</div>
                    </div>
                    <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-100">
                      <div className="bg-info-500 py-2">500</div>
                      <div className="bg-info-600 py-2">600</div>
                      <div className="bg-info-700 py-2">700</div>
                      <div className="bg-info-800 py-2">800</div>
                      <div className="bg-info-900 py-2">900</div>
                    </div>
                  </div>
                </div>

                {/* Layout Neutrals */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">System Surfaces & Borders</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <div className="bg-background border border-border p-4 rounded-xl flex flex-col justify-between h-20 shadow-sm">
                      <span className="text-slate-800">Background</span>
                      <span className="text-slate-500 font-mono text-[10px]">#F8FAFC</span>
                    </div>
                    <div className="bg-surface border border-border p-4 rounded-xl flex flex-col justify-between h-20 shadow-sm">
                      <span className="text-slate-800">Surface</span>
                      <span className="text-slate-500 font-mono text-[10px]">#FFFFFF</span>
                    </div>
                    <div className="bg-background-alt border border-border p-4 rounded-xl flex flex-col justify-between h-20 shadow-sm">
                      <span className="text-slate-800">BG Alternate</span>
                      <span className="text-slate-500 font-mono text-[10px]">#F1F5F9</span>
                    </div>
                    <div className="bg-border p-4 rounded-xl flex flex-col justify-between h-20 shadow-sm">
                      <span className="text-slate-800">Border Base</span>
                      <span className="text-slate-600 font-mono text-[10px]">#E2E8F0</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Typography Tokens */}
            <Card variant="outline">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Typography & hierarchy</h2>
              <div className="space-y-4 mt-6">
                <div className="flex flex-col md:flex-row md:items-baseline border-b border-border/50 pb-4 gap-4">
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">HEADING H1</span>
                  <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                    Centralized Hospital Operations
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline border-b border-border/50 pb-4 gap-4">
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">HEADING H2</span>
                  <span className="text-xl font-bold text-slate-800 font-sans">
                    Patient Registration & Demographics
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline border-b border-border/50 pb-4 gap-4">
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">SUBTITLE</span>
                  <span className="text-sm font-semibold text-primary-600 font-sans uppercase tracking-wider">
                    MODULE 05: PATIENT CARE
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline border-b border-border/50 pb-4 gap-4">
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">BODY TEXT</span>
                  <span className="text-sm text-slate-600 font-sans leading-relaxed">
                    The medical record index coordinates patient details, triage vitals, doctor encounters, and billing history. Clinical staff must authenticate using valid credentials.
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-4">
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">MUTED LABELS</span>
                  <span className="text-xs text-slate-500 font-sans font-medium">
                    Last sync time: 2026-08-19 12:54 PM (UTC+5)
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: BUTTONS & STATES */}
        {activeTab === "buttons" && (
          <Card variant="default" className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Button Component</h2>
              <p className="text-slate-500 text-xs">
                Supports sizes, colors, loading indicators, icon placements, active shrinks, and disabled outlines.
              </p>
            </div>

            {/* Colors / Variants */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">1. Color Themes</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="outline">Outline Variant</Button>
                <Button variant="ghost">Ghost Option</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">2. Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">Small (sm)</Button>
                <Button size="md" variant="primary">Medium (md)</Button>
                <Button size="lg" variant="primary">Large (lg)</Button>
              </div>
            </div>

            {/* Loading & Interactivity */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">3. Interactive & Loading States</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" isLoading={btnLoading} onClick={triggerBtnLoading}>
                  {btnLoading ? "Processing" : "Click to Simulate Load"}
                </Button>
                <Button variant="outline" isLoading>
                  Spinner Active
                </Button>
                <Button variant="primary" disabled>
                  Disabled State
                </Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
              </div>
            </div>

            {/* Icons */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">4. Icon Placements (Lucide Integrations)</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  Register Patient
                </Button>
                <Button variant="danger" leftIcon={<Trash2 size={16} />}>
                  Delete Entry
                </Button>
                <Button variant="outline" rightIcon={<ChevronRight size={16} />}>
                  Next Module
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Settings size={14} />}>
                  Config Panel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 3: STATUS BADGES */}
        {activeTab === "badges" && (
          <Card variant="default" className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Status Badges</h2>
              <p className="text-slate-500 text-xs">
                Light background indicators with solid dots, standard rounded borders, or rounded pill configurations.
              </p>
            </div>

            {/* Default Badges */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">1. Standard Status Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success / Paid</Badge>
                <Badge variant="danger">Danger / Canceled</Badge>
                <Badge variant="warning">Warning / Pending</Badge>
                <Badge variant="info">Info / In-Process</Badge>
              </div>
            </div>

            {/* Dot Variations */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">2. Indicator Dots</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary" showDot>
                  Active System
                </Badge>
                <Badge variant="success" showDot>
                  Doctor Available
                </Badge>
                <Badge variant="danger" showDot>
                  Critical Alert
                </Badge>
                <Badge variant="warning" showDot>
                  Awaiting Lab Results
                </Badge>
                <Badge variant="info" showDot>
                  En Route
                </Badge>
              </div>
            </div>

            {/* Pill Configurations */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">3. Rounded Pills & Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="primary" pill>
                  Default Pill
                </Badge>
                <Badge variant="success" pill showDot>
                  Success Pill
                </Badge>
                <Badge variant="danger" size="sm" pill>
                  Small Pill
                </Badge>
                <Badge variant="warning" size="sm" pill showDot>
                  Pending Small
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: CARDS & SURFACES */}
        {activeTab === "cards" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Cards & Surfaces</h2>
              <p className="text-slate-500 text-xs">
                Layout panels supporting shadow levels, outlines, transparent glass overlays, and hover lifts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Card */}
              <Card variant="default" hoverable>
                <Card.Header className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Layers size={18} className="text-primary-600" /> Default Card
                  </h3>
                  <Badge variant="success" pill size="sm">
                    Interactive Hover
                  </Badge>
                </Card.Header>
                <Card.Content>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Uses a soft custom shadow, light background, and subtle border lines. Designed to group dashboards, statistics, and modular panel displays.
                  </p>
                </Card.Content>
                <Card.Footer className="flex justify-between items-center text-xs text-slate-500">
                  <span>Created: 2026-08-19</span>
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                    Open File
                  </Button>
                </Card.Footer>
              </Card>

              {/* Glassmorphism Card */}
              <Card variant="glass" hoverable className="bg-gradient-to-br from-primary-50/20 to-indigo-50/10">
                <Card.Header className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-primary-500" /> Glassmorphism Panel
                  </h3>
                  <Badge variant="primary" pill size="sm">
                    Premium Glass
                  </Badge>
                </Card.Header>
                <Card.Content>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Applies blur effects and semi-transparent borders. Fits clinical settings requiring modern overlay dialogues, modal boxes, and pop-over widgets.
                  </p>
                </Card.Content>
                <Card.Footer className="flex justify-between items-center text-xs text-slate-500">
                  <span>Translucent Layer</span>
                  <Button variant="primary" size="sm">
                    Interactive Click
                  </Button>
                </Card.Footer>
              </Card>

              {/* Outline Card */}
              <Card variant="outline">
                <Card.Header>
                  <h3 className="font-bold text-slate-800">Outline Variant</h3>
                </Card.Header>
                <Card.Content>
                  <p className="text-slate-600 text-sm">
                    Transparent backgrounds with border outlines. Perfect for nested logs, sub-items, and low-priority settings panels.
                  </p>
                </Card.Content>
              </Card>

              {/* Muted Card */}
              <Card variant="muted">
                <Card.Header>
                  <h3 className="font-bold text-slate-800">Muted Content Surface</h3>
                </Card.Header>
                <Card.Content>
                  <p className="text-slate-600 text-sm">
                    Uses Slate background fills to separate informational containers. Fits list rows, audits, and clinical histories.
                  </p>
                </Card.Content>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 5: INPUTS & FORMS */}
        {activeTab === "inputs" && (
          <Card variant="default" className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Form Input Fields</h2>
              <p className="text-slate-500 text-xs">
                Supports icons, error validations, labels, placeholder states, and custom widths.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700">1. Basic Configurations</h3>
                <Input
                  label="Full Name"
                  placeholder="Enter full name..."
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  helperText="Use matching identity document naming."
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Password..."
                  defaultValue="Secret"
                  helperText="Required secure login credential."
                />
                <Input
                  label="Disabled Entry"
                  defaultValue="Cannot Edit Value"
                  disabled
                />
              </div>

              {/* Icon / Error Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700">2. Icons & Validations</h3>
                <Input
                  label="Email Search"
                  type="email"
                  placeholder="Type email address..."
                  leftIcon={<Search size={16} />}
                />
                <Input
                  label="Contact Phone"
                  placeholder="+92 300 1234567"
                  leftIcon={<Phone size={16} />}
                  rightIcon={<CheckCircle size={16} className="text-success-500 animate-pulse" />}
                />
                <Input
                  label="Secure Account URL"
                  defaultValue={demoErrorInput}
                  onChange={(e) => setDemoErrorInput(e.target.value)}
                  error="Invalid address format (e.g. user@domain.com)"
                  leftIcon={<User size={16} />}
                />
              </div>
            </div>
          </Card>
        )}

        {/* TAB 6: FEEDBACK & LOADERS */}
        {activeTab === "feedback" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spinner Indicators */}
            <Card variant="default" className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Spinners</h2>
                <p className="text-slate-500 text-xs">Indeterminate loader rings.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <Spinner size="sm" variant="primary" />
                  <Spinner size="md" variant="primary" />
                  <Spinner size="lg" variant="primary" />
                </div>
                <div className="flex items-center gap-6">
                  <Spinner size="md" variant="secondary" />
                  <Spinner size="md" variant="success" />
                  <Spinner size="md" variant="danger" />
                </div>
              </div>
            </Card>

            {/* Skeleton Loaders */}
            <Card variant="default" className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Skeleton Loaders</h2>
                <p className="text-slate-500 text-xs">Simulates wireframe content during loads.</p>
              </div>
              <div className="space-y-4">
                {/* Simulated Patient List Row */}
                <div className="flex items-center gap-3 p-3 border border-border/50 rounded-xl bg-slate-50">
                  <Skeleton variant="circular" width={40} height={40} className="shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                  </div>
                  <Skeleton variant="rectangular" width={60} height={24} className="shrink-0" />
                </div>

                {/* Simulated Chart/Stats */}
                <div className="space-y-2">
                  <Skeleton variant="rectangular" height={100} />
                  <div className="flex justify-between">
                    <Skeleton variant="text" width="30%" height={12} />
                    <Skeleton variant="text" width="20%" height={12} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
