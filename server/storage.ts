import { User, Item, Issuance, Audit, InsertUser, InsertItem, InsertIssuance, InsertAudit } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Item operations
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  updateItemCount(id: number, count: number): Promise<Item>;
  
  // Issuance operations
  createIssuance(issuance: InsertIssuance): Promise<Issuance>;
  getIssuances(): Promise<Issuance[]>;
  updateIssuance(id: number, returnedDate: Date): Promise<Issuance>;
  
  // Audit operations
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudits(): Promise<Audit[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private issuances: Map<number, Issuance>;
  private audits: Map<number, Audit>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.issuances = new Map();
    this.audits = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with default inventory
    this.initializeInventory();
  }

  private initializeInventory() {
    const defaultItems: InsertItem[] = [
      // Monitors
      { name: "Dell 32\" Monitor", category: "Monitors", subCategory: "Dell 32\" Monitors", count: 3 },
      { name: "Dell 24\" Monitor", category: "Monitors", subCategory: "Dell 24\" Monitors", count: 0 },
      { name: "Dell 30\" Monitor", category: "Monitors", subCategory: "Dell 30\" Monitors", count: 0 },

      // Laptops
      { name: "Dell Laptop", category: "Laptops", subCategory: "Dell Laptops", count: 30 },
      { name: "London Laptop", category: "Laptops", subCategory: "London Laptops", count: 9 },

      // Accessories
      { name: "Dell Type C Charger", category: "Accessories", subCategory: "Chargers", count: 54 },
      { name: "Dell Quietkey Keyboard", category: "Accessories", subCategory: "Keyboards", count: 39 },
      { name: "Dell USB Optical Mouse", category: "Accessories", subCategory: "Mice", count: 47 },
      { name: "Docking Station", category: "Accessories", subCategory: "Docks", count: 69 },
      { name: "Hardrive", category: "Accessories", subCategory: "Storage", count: 3 },
      { name: "Pendrive", category: "Accessories", subCategory: "Storage", count: 16 },
      { name: "HDMI Cable", category: "Accessories", subCategory: "Cables", count: 7 },

      // iPhone Accessories
      { name: "iPhone 12 Case", category: "iPhone Accessories", subCategory: "Cases", count: 25 },
      { name: "iPhone 13/14 Case", category: "iPhone Accessories", subCategory: "Cases", count: 10 },
      { name: "iPhone XR Case", category: "iPhone Accessories", subCategory: "Cases", count: 1 },
      { name: "iPhone 12/11 Screen Protector", category: "iPhone Accessories", subCategory: "Screen Protectors", count: 62 },
      { name: "iPhone 13 Screen Protector", category: "iPhone Accessories", subCategory: "Screen Protectors", count: 73 },
      { name: "iPhone XR Screen Protector", category: "iPhone Accessories", subCategory: "Screen Protectors", count: 1 },
      { name: "iPhone Charger", category: "iPhone Accessories", subCategory: "Chargers", count: 36 },
      { name: "iPhone Cable", category: "iPhone Accessories", subCategory: "Cables", count: 26 },

      // iPhones
      { name: "iPhone 12", category: "iPhones", subCategory: null, count: 0 },
      { name: "iPhone 13", category: "iPhones", subCategory: null, count: 29 },

      // Other
      { name: "Logitech Headset", category: "Accessories", subCategory: "Audio", count: 19 },
      { name: "Laptop Bag", category: "Accessories", subCategory: "Bags", count: 22 },
    ];

    defaultItems.forEach(item => {
      const id = this.currentId++;
      this.items.set(id, {
        ...item,
        id,
        lastUpdated: new Date()
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, role: "issuer" };
    this.users.set(id, user);
    return user;
  }

  // Item operations
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async updateItemCount(id: number, count: number): Promise<Item> {
    const item = this.items.get(id);
    if (!item) throw new Error("Item not found");
    
    const updatedItem = { ...item, count, lastUpdated: new Date() };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  // Issuance operations
  async createIssuance(issuance: InsertIssuance): Promise<Issuance> {
    const id = this.currentId++;
    const newIssuance: Issuance = { ...issuance, id, returnedDate: null };
    this.issuances.set(id, newIssuance);
    return newIssuance;
  }

  async getIssuances(): Promise<Issuance[]> {
    return Array.from(this.issuances.values());
  }

  async updateIssuance(id: number, returnedDate: Date): Promise<Issuance> {
    const issuance = this.issuances.get(id);
    if (!issuance) throw new Error("Issuance not found");
    
    const updatedIssuance = { ...issuance, returnedDate };
    this.issuances.set(id, updatedIssuance);
    return updatedIssuance;
  }

  // Audit operations
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const id = this.currentId++;
    const newAudit: Audit = { ...audit, id, timestamp: new Date() };
    this.audits.set(id, newAudit);
    return newAudit;
  }

  async getAudits(): Promise<Audit[]> {
    return Array.from(this.audits.values());
  }
}

export const storage = new MemStorage();