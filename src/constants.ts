import React from 'react';
import { 
  Home, 
  Search, 
  User, 
  LogIn, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter,
  Menu,
  X,
  ArrowRight,
  Square,
  Wind,
  DoorOpen,
  ShieldCheck,
  Users,
  ShieldAlert,
  Send,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

export interface Listing {
  id: string;
  title: string;
  price: string;
  area: string;
  location: string;
  image: string;
  tags: string[];
  isHot?: boolean;
  isNew?: boolean;
}

export const listings: Listing[] = [
  {
    id: '1',
    title: 'Căn hộ studio Quận 1',
    price: '4.5 triệu',
    area: '30m²',
    location: 'Quận 1',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    tags: ['Ban công'],
    isNew: true
  },
  {
    id: '2',
    title: 'Phòng trọ khép kín Thủ Đức',
    price: '2.8 triệu',
    area: '20m²',
    location: 'Thủ Đức',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    tags: ['Gác lửng']
  },
  {
    id: '3',
    title: 'Nhà nguyên căn Bình Thạnh',
    price: '8 triệu',
    area: '60m²',
    location: 'Bình Thạnh',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800',
    tags: ['3 phòng'],
    isHot: true
  },
  {
    id: '4',
    title: 'Ký túc xá cao cấp Quận 7',
    price: '1.5 triệu',
    area: '15m²',
    location: 'Quận 7',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
    tags: ['Máy lạnh']
  }
];

export const areas = [
  { name: 'Hải Châu', count: '1,240', image: 'https://govis.vn/wp-content/uploads/2020/06/the-royal-golvis-0902.003.jpg' },
  { name: 'Thanh Khê', count: '850', image: 'https://cdn.khamphadanang.vn/wp-content/uploads/2024/01/quang-canh-quan-thanh-khe-1.jpeg?strip=all&lossy=1&ssl=1' },
  { name: 'Sơn Trà', count: '2,100', image: 'https://cdn.justfly.vn/1200x630/media/63/dc/6b94-3fc2-4567-9e59-5ea1b4bcbe8c.jpg' },
  { name: 'Ngũ Hành Sơn', count: '3,450', image: 'https://cdn.tuoitre.vn/471584752817336320/2023/7/23/danh-thang-nui-da-ngu-hanh-son12-1690109709634822744482.jpg' },
  { name: 'Liên Chiểu', count: '1,800', image: 'https://static1.cafeland.vn/cafelandnew/hinh-anh/2024/11/11/95/image-20241111171700-1.jpeg' }
];
