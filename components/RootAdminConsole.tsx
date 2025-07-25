import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  Crown,
  Store,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Pause,
  Ban,
  Edit,
  Trash2,
  Download,
  Upload,
  Calendar,
  Clock,
  Activity,
  Shield,
  CreditCard,
  Database,
  Palette,
  Megaphone,
  HeadphonesIcon,
  FileText,
  LogOut,
  Menu,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Zap,
  Globe,
  Smartphone,
  Mail,
  PhoneCall,
  MapPin,
  Building,
  Coins,
  BarChart3,
  PieChart,
  LineChart,
  Calendar as CalendarIcon,
  Timer,
  AlertCircle,
  Info,
  RefreshCw,
  PlayCircle,
  StopCircle,
  Archive,
  Backup,
  HardDrive,
  CloudDownload,
  FileDown,
  History,
  Key,
  Link,
  Layers,
  Paintbrush,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Terminal,
  Server,
  Wifi,
  WifiOff,
  Signal,
  Cpu,
  MemoryStick,
  Radio,
  Ticket,
  MessageSquare,
  UserCircle,
  Clock3,
  CheckCheck,
  X,
  AlertOctagon,
  BellRing,
  Newspaper,
  Broadcast,
  Target,
  Gauge,
  Sparkles,
  Star,
  Heart,
  ThumbsUp,
  Share2,
  Send,
  Reply,
  Forward,
  Bookmark,
  Flag,
  Tag,
  Folder,
  FolderOpen,
  FileImage,
  FileVideo,
  FileAudio,
  FilePdf,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Cloud,
  CloudUpload,
  CloudSync,
  Compass,
  Navigation,
  Locate,
  Route,
  Truck,
  Plane,
  Ship,
  Car,
  Bike,
  Walk,
  Home,
  Building2,
  Factory,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  CreditCard as CreditCardIcon,
  Banknote,
  Wallet,
  Receipt,
  Calculator,
  Scale,
  Ruler,
  Scissors,
  Hammer,
  Wrench,
  Screwdriver,
  Drill,
  Saw,
  Pickaxe,
  Shovel,
  Brush,
  Pen,
  Pencil,
  Eraser,
  PenTool,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Video,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Shuffle,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  Tv,
  Radio as RadioIcon,
  Headphones,
  Speaker,
  Bluetooth,
  Usb,
  HardDisk,
  Printer,
  Scanner,
  Keyboard,
  Mouse,
  Tablet,
  Laptop,
  Desktop,
  Watch,
  Gamepad2,
  Joystick,
  Dices,
  Puzzle,
  Trophy,
  Medal,
  Award,
  Gift,
  PartyPopper,
  Cake,
  Coffee,
  Wine,
  Beer,
  Pizza,
  Hamburger,
  Sandwich,
  Salad,
  Apple,
  Banana,
  Cherry,
  Grape,
  Lemon,
  Orange,
  Peach,
  Pear,
  Strawberry,
  Watermelon,
  Carrot,
  Corn,
  Pepper,
  Potato,
  Tomato,
  Leaf,
  Tree,
  Flower,
  Flower2,
  Seedling,
  Sprout,
  Cactus,
  Palmtree,
  Evergreen,
  Deciduous,
  PineTree,
  Waves,
  Mountain,
  Volcano,
  Desert,
  Island,
  Sunrise,
  Sunset,
  Sun as SunIcon,
  Moon as MoonIcon,
  Star as StarIcon,
  Sparkle,
  Zap as ZapIcon,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudHail,
  Tornado,
  Hurricane,
  Snowflake,
  Droplets,
  Umbrella,
  Wind,
  Thermometer,
  Gauge as GaugeIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon,
  Milestone,
  Signpost,
  MapPin as MapPinIcon,
  Map,
  Globe as GlobeIcon,
  Earth,
  Satellite,
  Rocket,
  Plane as PlaneIcon,
  Car as CarIcon,
  Truck as TruckIcon,
  Bus,
  Train,
  Tram,
  Ship as ShipIcon,
  Boat,
  Anchor,
  Bike as BikeIcon,
  Scooter,
  Motorcycle,
  Fuel,
  BatteryCharging,
  Battery,
  BatteryLow,
  BatteryFull,
  Plug,
  Power,
  PowerOff,
  Flashlight,
  Lightbulb,
  Lamp,
  Candle,
  Flame,
  Fire,
  Fireplace,
  Heater,
  Fan,
  AirVent,
  Snowflake as SnowflakeIcon,
  Thermometer as ThermometerIcon,
  Droplets as DropletsIcon,
  Waves as WavesIcon,
  Wind as WindIcon,
  Tornado as TornadoIcon,
  Hurricane as HurricaneIcon,
  Earthquake,
  Volcano as VolcanoIcon,
  Landslide,
  Tsunami,
  Flood,
  Drought,
  Wildfire,
  Avalanche,
  Blizzard,
  Cyclone,
  Monsoon,
  Sandstorm,
  Hail,
  Sleet,
  Fog,
  Mist,
  Smog,
  Dust,
  Pollen,
  Virus,
  Bacteria,
  Microbe,
  Dna,
  Pill,
  Syringe,
  Stethoscope,
  Bandage,
  Thermometer as ThermometerIcon2,
  HeartHandshake,
  Activity as ActivityIcon,
  Zap as ZapIcon2,
  Gauge as GaugeIcon2,
  BarChart,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart,
  ScatterChart,
  RadarChart,
  FunnelChart,
  TreemapChart,
  CandlestickChart,
  BoxPlotChart,
  HeatmapChart,
  WaterfallChart,
  BubbleChart,
  SankeyChart,
  SunburstChart,
  TreeChart,
  NetworkChart,
  GraphChart,
  FlowChart,
  OrgChart,
  Timeline,
  Gantt,
  Kanban,
  Calendar as CalendarIcon2,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Stopwatch,
  Hourglass,
  Alarm,
  Bell,
  BellRing as BellRingIcon,
  Notification,
  Message,
  MessageSquare as MessageSquareIcon,
  MessageCircle,
  Mail as MailIcon,
  Inbox,
  Outbox,
  Send as SendIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Archive as ArchiveIcon,
  Trash,
  Delete,
  Edit as EditIcon,
  PenTool as PenToolIcon,
  Highlighter,
  Marker,
  Crayon,
  Paintbrush as PaintbrushIcon,
  Palette as PaletteIcon,
  Pipette,
  Bucket,
  Spray,
  Roller,
  Brush as BrushIcon,
  Sponge,
  Cloth,
  Towel,
  Soap,
  Shampoo,
  Toothbrush,
  Razor,
  Scissors as ScissorsIcon,
  Comb,
  Hairdryer,
  Mirror,
  Makeup,
  Lipstick,
  Mascara,
  Perfume,
  Cologne,
  Deodorant,
  Lotion,
  Sunscreen,
  Moisturizer,
  Cleanser,
  Toner,
  Serum,
  Mask,
  Scrub,
  Exfoliant,
  Peel,
  Treatment,
  Cream,
  Gel,
  Foam,
  Oil,
  Balm,
  Salve,
  Ointment,
  Bandaid,
  Gauze,
  Tape,
  Wrap,
  Splint,
  Crutch,
  Wheelchair,
  Walker,
  Cane,
  Prosthetic,
  Hearing,
  Glasses,
  Sunglasses,
  Contact,
  Lens,
  Magnifier,
  Microscope,
  Telescope,
  Binoculars,
  Periscope,
  Radar,
  Sonar,
  Lidar,
  Gps,
  Compass as CompassIcon2,
  Altimeter,
  Barometer,
  Hygrometer,
  Seismometer,
  Geiger,
  Spectrometer,
  Oscilloscope,
  Multimeter,
  Voltmeter,
  Ammeter,
  Ohmmeter,
  Wattmeter,
  Frequency,
  Signal as SignalIcon,
  Antenna,
  Satellite as SatelliteIcon,
  Router,
  Modem,
  Switch as SwitchIcon,
  Hub,
  Bridge,
  Gateway,
  Firewall,
  Proxy,
  Vpn,
  Ssl,
  Tls,
  Https,
  Http,
  Ftp,
  Ssh,
  Telnet,
  Smtp,
  Pop,
  Imap,
  Dns,
  Dhcp,
  Tcp,
  Udp,
  Ip,
  Mac,
  Lan,
  Wan,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Nfc,
  Rfid,
  Infrared,
  Laser,
  Led,
  Lcd,
  Oled,
  Plasma,
  Crt,
  Projector,
  Screen,
  Display,
  Monitor as MonitorIcon,
  Tv as TvIcon,
  Radio as RadioIcon2,
  Speaker as SpeakerIcon,
  Headphones as HeadphonesIcon,
  Earbuds,
  Microphone,
  Amplifier,
  Mixer,
  Equalizer,
  Synthesizer,
  Drum,
  Guitar,
  Piano,
  Violin,
  Trumpet,
  Saxophone,
  Flute,
  Clarinet,
  Oboe,
  Bassoon,
  Tuba,
  Trombone,
  French,
  Harp,
  Organ,
  Accordion,
  Harmonica,
  Xylophone,
  Marimba,
  Vibraphone,
  Timpani,
  Snare,
  Kick,
  Cymbal,
  Triangle,
  Tambourine,
  Shaker,
  Cowbell,
  Woodblock,
  Claves,
  Castanets,
  Maracas,
  Bongos,
  Congas,
  Djembe,
  Tabla,
  Sitar,
  Banjo,
  Mandolin,
  Ukulele,
  Cello,
  Bass,
  Contrabass,
  Viola,
  Fiddle,
  Erhu,
  Guzheng,
  Koto,
  Shamisen,
  Didgeridoo,
  Bagpipes,
  Kalimba,
  Ocarina,
  Recorder,
  Piccolo,
  Cor,
  Euphonium,
  Bugle,
  Cornet,
  Flugelhorn,
  Mellophone,
  Sousaphone,
  Helicon,
  Serpent,
  Ophicleide,
  Zinke,
  Shawm,
  Crumhorn,
  Dulcian,
  Rackett,
  Rauschpfeife,
  Gemshorn,
  Bombarde,
  Suona,
  Zurna,
  Duduk,
  Ney,
  Mizmar,
  Arghul,
  Mijwiz,
  Riq,
  Darbuka,
  Bendir,
  Tar,
  Oud,
  Qanun,
  Santur,
  Setar,
  Tanbur,
  Rubab,
  Sarod,
  Veena,
  Tampura,
  Santoor,
  Harmonium,
  Tabla as TablaIcon,
  Mridangam,
  Pakhawaj,
  Khol,
  Madal,
  Dhol,
  Dholak,
  Nagara,
  Tasha,
  Damaru,
  Ghatam,
  Kanjira,
  Morsing,
  Thavil,
  Chenda,
  Idakka,
  Timila,
  Mizhavu,
  Chengila,
  Panchamukha,
  Ezhupara,
  Toppi,
  Urumi,
  Parai,
  Thappu,
  Kuzhal,
  Nadaswaram,
  Tavil,
  Kombu,
  Shankh,
  Sruti,
  Gottuvadyam,
  Chitravina,
  Mohan,
  Swaramandal,
  Surpeti,
  Tanpura,
  Mayuri,
  Bulbul,
  Esraj,
  Dilruba,
  Taus,
  Sarinda,
  Kamaicha,
  Ravanahatha,
  Onavillu,
  Pulluvan,
  Kudum,
  Kanjira as KanjiraIcon,
  Kuzhal as KuzhalIcon,
  Nadaswaram as NadaswaramIcon,
  Tavil as TavilIcon,
  Kombu as KombuIcon,
  Shankh as ShankhIcon,
  Sruti as SrutiIcon,
  Gottuvadyam as GottuvadyamIcon,
  Chitravina as ChitravinaIcon,
  Mohan as MohanIcon,
  Swaramandal as SwaramandalIcon,
  Surpeti as SurpetiIcon,
  Tanpura as TanpuraIcon,
  Mayuri as MayuriIcon,
  Bulbul as BulbulIcon,
  Esraj as EsrajIcon,
  Dilruba as DilrubaIcon,
  Taus as TausIcon,
  Sarinda as SarindaIcon,
  Kamaicha as KamaichaIcon,
  Ravanahatha as RavanahathIcon,
  Onavillu as OnavilluIcon,
  Pulluvan as PulluvanIcon,
  Kudum as KudumIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RootAdminConsoleProps {
  user: any;
  onLogout: () => void;
}

interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Store {
  id: string;
  name: string;
  type: string;
  status: string;
  clients: number;
  stockValue: number;
  profit: number;
  profitPercent: number;
  lastActivity: string;
  logo?: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  employees: number;
  createdAt: string;
}

interface ApiService {
  id: string;
  name: string;
  purpose: string;
  status: 'online' | 'offline' | 'error';
  lastPing: string;
  uptime: number;
  latency: number;
  enabled: boolean;
  apiKey?: string;
  rateLimit: number;
}

interface SupportTicket {
  id: string;
  title: string;
  store: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved';
  createdAt: string;
  assignedTo?: string;
  messages: Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: string;
    attachments?: string[];
  }>;
}

export function RootAdminConsole({ user, onLogout }: RootAdminConsoleProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metalPrices, setMetalPrices] = useState<MetalPrice[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [apiServices, setApiServices] = useState<ApiService[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiService | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Load mock data
  useEffect(() => {
    loadMockData();
    // Update metal prices every 3 minutes
    const interval = setInterval(loadMockData, 180000);
    return () => clearInterval(interval);
  }, []);

  const loadMockData = () => {
    // Mock metal prices
    setMetalPrices([
      { symbol: 'Au24k', name: 'Gold 24K', price: 2087.50, change: -12.30, changePercent: -0.59 },
      { symbol: 'Au14k', name: 'Gold 14K', price: 1217.04, change: -7.18, changePercent: -0.59 },
      { symbol: 'Pt', name: 'Platinum', price: 1025.00, change: 15.40, changePercent: 1.53 },
      { symbol: 'Ag', name: 'Silver', price: 24.85, change: -0.32, changePercent: -1.27 }
    ]);

    // Mock stores
    setStores([
      {
        id: '1',
        name: 'Golden State Jewelry',
        type: 'Jewelry',
        status: 'Active',
        clients: 1247,
        stockValue: 485000,
        profit: 45000,
        profitPercent: 18.5,
        lastActivity: '2 minutes ago',
        owner: 'Sarah Johnson',
        email: 'sarah@goldenstateaz.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Phoenix, AZ 85001',
        employees: 8,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: 'Quick Cash Pawn',
        type: 'Pawn',
        status: 'Active',
        clients: 892,
        stockValue: 320000,
        profit: 28000,
        profitPercent: 15.2,
        lastActivity: '15 minutes ago',
        owner: 'Michael Chen',
        email: 'mike@quickcashpawn.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Los Angeles, CA 90210',
        employees: 5,
        createdAt: '2024-02-01'
      },
      {
        id: '3',
        name: 'Elite Jewelry & Pawn',
        type: 'Hybrid',
        status: 'Active',
        clients: 653,
        stockValue: 275000,
        profit: 22000,
        profitPercent: 16.8,
        lastActivity: '1 hour ago',
        owner: 'David Rodriguez',
        email: 'david@elitejewelrypawn.com',
        phone: '(555) 456-7890',
        address: '789 Pine St, Dallas, TX 75201',
        employees: 6,
        createdAt: '2024-01-28'
      }
    ]);

    // Mock API services
    setApiServices([
      {
        id: '1',
        name: 'GoldAPI',
        purpose: 'Live precious metals pricing',
        status: 'online',
        lastPing: '30 seconds ago',
        uptime: 99.8,
        latency: 142,
        enabled: true,
        rateLimit: 1000
      },
      {
        id: '2',
        name: 'Kitco',
        purpose: 'Secondary metals pricing',
        status: 'online',
        lastPing: '45 seconds ago',
        uptime: 99.5,
        latency: 234,
        enabled: true,
        rateLimit: 500
      },
      {
        id: '3',
        name: 'RapNet',
        purpose: 'Diamond pricing database',
        status: 'error',
        lastPing: '5 minutes ago',
        uptime: 98.2,
        latency: 1200,
        enabled: false,
        rateLimit: 200
      },
      {
        id: '4',
        name: 'WatchCharts',
        purpose: 'Watch valuation data',
        status: 'online',
        lastPing: '1 minute ago',
        uptime: 99.9,
        latency: 89,
        enabled: true,
        rateLimit: 300
      },
      {
        id: '5',
        name: 'OpenAI',
        purpose: 'AI-powered assistance',
        status: 'online',
        lastPing: '20 seconds ago',
        uptime: 99.7,
        latency: 256,
        enabled: true,
        rateLimit: 100
      }
    ]);

    // Mock support tickets
    setSupportTickets([
      {
        id: '1',
        title: 'Unable to process customer payout',
        store: 'Golden State Jewelry',
        priority: 'high',
        status: 'open',
        createdAt: '2024-01-25T10:30:00Z',
        assignedTo: 'John Smith',
        messages: [
          {
            id: '1',
            sender: 'Sarah Johnson',
            message: 'Hi, I\'m having trouble processing a customer payout. The system keeps showing an error.',
            timestamp: '2024-01-25T10:30:00Z'
          }
        ]
      },
      {
        id: '2',
        title: 'API integration failing',
        store: 'Quick Cash Pawn',
        priority: 'critical',
        status: 'in_progress',
        createdAt: '2024-01-25T09:15:00Z',
        assignedTo: 'Jane Doe',
        messages: [
          {
            id: '1',
            sender: 'Michael Chen',
            message: 'The GoldAPI integration is failing and we can\'t get live pricing.',
            timestamp: '2024-01-25T09:15:00Z'
          }
        ]
      }
    ]);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Root Dashboard', icon: BarChart3 },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'api', label: 'API Management', icon: Settings },
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'news', label: 'News & Alerts', icon: Megaphone },
    { id: 'support', label: 'Support Tickets', icon: HeadphonesIcon },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'backups', label: 'Backups', icon: Database }
  ];

  const kpiData = [
    { label: 'Total Stores', value: '3', change: '+2', trend: 'up', onClick: () => setActiveTab('stores') },
    { label: 'Active Users', value: '24', change: '+6', trend: 'up', onClick: null },
    { label: 'Items Taken-In', value: '1,847', change: '+127', trend: 'up', onClick: null },
    { label: 'Total $ Value', value: '$1,080,000', change: '+$45,000', trend: 'up', onClick: null },
    { label: 'Daily Items', value: '47', change: '+8', trend: 'up', onClick: null },
    { label: 'System Uptime', value: '99.8%', change: '+0.2%', trend: 'up', onClick: null }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-store':
        toast.info('Add Store functionality would open here');
        break;
      case 'push-alert':
        toast.info('Push Banner Alert functionality would open here');
        break;
      case 'test-apis':
        toast.info('Testing all APIs...');
        setTimeout(() => toast.success('All APIs tested successfully'), 2000);
        break;
      default:
        toast.info(`${action} functionality coming soon`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
      case 'resolved':
        return 'bg-green-500';
      case 'suspended':
      case 'offline':
      case 'in_progress':
        return 'bg-yellow-500';
      case 'banned':
      case 'error':
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-yellow-600" />
                <div>
                  <h1 className="text-xl font-bold">Root Admin Console</h1>
                  <p className="text-sm text-muted-foreground">Platform Management</p>
                </div>
              </div>
            </div>

            {/* Live Metal Ticker */}
            <div className="hidden lg:flex items-center space-x-6 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-1 text-sm">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Live Metals</span>
              </div>
              <div className="flex items-center space-x-6">
                {metalPrices.map((metal) => (
                  <div key={metal.symbol} className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{metal.symbol}</span>
                    <span className="text-sm">${metal.price.toFixed(2)}</span>
                    <span className={`text-xs flex items-center ${
                      metal.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metal.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {metal.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="hidden sm:block">{user?.name || 'Root Admin'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium">{user?.name || 'Root Administrator'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                      <Badge variant="outline" className="w-fit text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Root Admin
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.info('Profile settings coming soon')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-t border-border">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center space-x-2 whitespace-nowrap"
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Root Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    Platform Overview
                  </h2>
                  <p className="text-muted-foreground">
                    Managing all jewelry & pawn stores across the platform
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiData.map((kpi, index) => (
                  <Card 
                    key={index} 
                    className={`${kpi.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                    onClick={kpi.onClick || undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="text-2xl font-bold">{kpi.value}</p>
                        </div>
                        <div className={`flex items-center space-x-1 text-sm ${
                          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{kpi.change}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => handleQuickAction('add-store')}
                    >
                      <Store className="h-6 w-6" />
                      <span>Add Store</span>
                      <span className="text-xs text-muted-foreground">Manual onboarding</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => handleQuickAction('push-alert')}
                    >
                      <BellRing className="h-6 w-6" />
                      <span>Push Banner Alert</span>
                      <span className="text-xs text-muted-foreground">System-wide notification</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => handleQuickAction('test-apis')}
                    >
                      <Zap className="h-6 w-6" />
                      <span>Test All APIs</span>
                      <span className="text-xs text-muted-foreground">Health check</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Activity</CardTitle>
                  <CardDescription>Latest actions across all stores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { store: 'Golden State Jewelry', action: 'New customer registered', time: '2 minutes ago', type: 'user' },
                      { store: 'Quick Cash Pawn', action: 'API integration updated', time: '15 minutes ago', type: 'api' },
                      { store: 'Elite Jewelry & Pawn', action: 'Large payout processed', time: '1 hour ago', type: 'transaction' },
                      { store: 'Golden State Jewelry', action: 'Monthly report generated', time: '2 hours ago', type: 'report' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'user' ? 'bg-green-500' :
                            activity.type === 'api' ? 'bg-blue-500' :
                            activity.type === 'transaction' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.store}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stores Management */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Stores Management</h2>
                  <p className="text-muted-foreground">Monitor and manage all stores on the platform</p>
                </div>
                <Button onClick={() => handleQuickAction('add-store')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Store
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Stores ({stores.length})</CardTitle>
                  <CardDescription>Complete overview of platform stores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Clients</TableHead>
                          <TableHead>Stock Value</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stores.map((store) => (
                          <TableRow key={store.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Store className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{store.name}</div>
                                  <div className="text-sm text-muted-foreground">{store.owner}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{store.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(store.status)}`} />
                                <span className="text-sm">{store.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{store.clients.toLocaleString()}</TableCell>
                            <TableCell>{formatCurrency(store.stockValue)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatCurrency(store.profit)}</span>
                                <span className="text-xs text-green-600">+{store.profitPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {store.lastActivity}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setSelectedStore(store)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent className="w-[500px]">
                                    <SheetHeader>
                                      <SheetTitle>Store Details</SheetTitle>
                                      <SheetDescription>
                                        Manage store information and settings
                                      </SheetDescription>
                                    </SheetHeader>
                                    
                                    {selectedStore && (
                                      <div className="space-y-6 mt-6">
                                        <div className="space-y-4">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                              <Store className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                              <h3 className="font-medium">{selectedStore.name}</h3>
                                              <p className="text-sm text-muted-foreground">{selectedStore.type} Store</p>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Owner</Label>
                                              <p className="text-sm">{selectedStore.owner}</p>
                                            </div>
                                            <div>
                                              <Label>Status</Label>
                                              <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedStore.status)}`} />
                                                <span className="text-sm">{selectedStore.status}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <Label>Clients</Label>
                                              <p className="text-sm">{selectedStore.clients.toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <Label>Employees</Label>
                                              <p className="text-sm">{selectedStore.employees}</p>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <Label>Contact Information</Label>
                                            <div className="space-y-2 mt-2">
                                              <div className="flex items-center space-x-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedStore.email}</span>
                                              </div>
                                              <div className="flex items-center space-x-2 text-sm">
                                                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedStore.phone}</span>
                                              </div>
                                              <div className="flex items-center space-x-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedStore.address}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <Label>Performance Metrics</Label>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                              <div className="bg-muted/50 p-3 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Stock Value</p>
                                                <p className="font-medium">{formatCurrency(selectedStore.stockValue)}</p>
                                              </div>
                                              <div className="bg-muted/50 p-3 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Monthly Profit</p>
                                                <p className="font-medium">{formatCurrency(selectedStore.profit)}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-4">
                                          <Label>Store Actions</Label>
                                          <div className="space-y-2">
                                            <Button variant="outline" className="w-full justify-start">
                                              <Pause className="h-4 w-4 mr-2" />
                                              Suspend Store
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start text-destructive">
                                              <Ban className="h-4 w-4 mr-2" />
                                              Ban Store
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </SheetContent>
                                </Sheet>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Store
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Suspend
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Ban className="h-4 w-4 mr-2" />
                                      Ban Store
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Management */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">API Management</h2>
                  <p className="text-muted-foreground">Monitor and configure external API services</p>
                </div>
                <Button onClick={() => handleQuickAction('test-apis')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test All APIs
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apiServices.map((api) => (
                  <Card key={api.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{api.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(api.status)}`} />
                          <span className="text-sm capitalize">{api.status}</span>
                        </div>
                      </div>
                      <CardDescription>{api.purpose}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Ping:</span>
                          <span>{api.lastPing}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="text-green-600">{api.uptime}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Latency:</span>
                          <span className={api.latency > 500 ? 'text-red-600' : 'text-green-600'}>
                            {api.latency}ms
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info(`Testing ${api.name}...`)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedApi(api)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Config
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Configure {api.name}</SheetTitle>
                              <SheetDescription>
                                Manage API settings and authentication
                              </SheetDescription>
                            </SheetHeader>
                            
                            {selectedApi && (
                              <div className="space-y-6 mt-6">
                                <div className="space-y-4">
                                  <div>
                                    <Label>API Status</Label>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Switch checked={selectedApi.enabled} />
                                      <span className="text-sm">
                                        {selectedApi.enabled ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input
                                      id="apiKey"
                                      type="password"
                                      placeholder="Enter API key"
                                      value={selectedApi.apiKey || ''}
                                      className="mt-2"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                                    <Input
                                      id="rateLimit"
                                      type="number"
                                      value={selectedApi.rateLimit}
                                      className="mt-2"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Performance Metrics</Label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Uptime</p>
                                        <p className="font-medium">{selectedApi.uptime}%</p>
                                      </div>
                                      <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Latency</p>
                                        <p className="font-medium">{selectedApi.latency}ms</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button className="flex-1">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button variant="outline">
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Test API
                                  </Button>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Support Tickets */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Support Tickets</h2>
                  <p className="text-muted-foreground">Manage customer support requests</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Open', count: 12, color: 'bg-blue-100 text-blue-800' },
                  { label: 'In Progress', count: 8, color: 'bg-yellow-100 text-yellow-800' },
                  { label: 'Waiting', count: 3, color: 'bg-orange-100 text-orange-800' },
                  { label: 'Resolved', count: 47, color: 'bg-green-100 text-green-800' }
                ].map((status) => (
                  <Card key={status.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{status.label}</p>
                          <p className="text-2xl font-bold">{status.count}</p>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Latest support requests from stores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{ticket.title}</h3>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {ticket.store} • {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{ticket.status.replace('_', ' ')}</Badge>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-[600px]">
                                <SheetHeader>
                                  <SheetTitle>{ticket.title}</SheetTitle>
                                  <SheetDescription>
                                    Ticket #{ticket.id} from {ticket.store}
                                  </SheetDescription>
                                </SheetHeader>
                                
                                {selectedTicket && (
                                  <div className="space-y-6 mt-6">
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-4">
                                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                                          {selectedTicket.priority}
                                        </Badge>
                                        <Badge variant="outline">
                                          {selectedTicket.status.replace('_', ' ')}
                                        </Badge>
                                        {selectedTicket.assignedTo && (
                                          <div className="flex items-center space-x-2 text-sm">
                                            <UserCircle className="h-4 w-4" />
                                            <span>Assigned to {selectedTicket.assignedTo}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <Label>Store Information</Label>
                                        <p className="text-sm mt-1">{selectedTicket.store}</p>
                                      </div>
                                      
                                      <div>
                                        <Label>Created</Label>
                                        <p className="text-sm mt-1">{formatDate(selectedTicket.createdAt)}</p>
                                      </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-4">
                                      <Label>Conversation</Label>
                                      <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {selectedTicket.messages.map((message) => (
                                          <div key={message.id} className="bg-muted/50 p-3 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium">{message.sender}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {formatDate(message.timestamp)}
                                              </span>
                                            </div>
                                            <p className="text-sm">{message.message}</p>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Textarea placeholder="Type your response..." />
                                        <div className="flex justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm">
                                              <FileImage className="h-4 w-4 mr-1" />
                                              Attach
                                            </Button>
                                          </div>
                                          <Button size="sm">
                                            <Send className="h-4 w-4 mr-1" />
                                            Send Reply
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {ticket.messages[0]?.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {!['dashboard', 'stores', 'api', 'support'].includes(activeTab) && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {navigationItems.find(item => item.id === activeTab)?.label} Module
                </h3>
                <p className="text-muted-foreground">
                  This module is under development and will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}