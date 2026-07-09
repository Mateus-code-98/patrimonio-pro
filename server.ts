import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
// @ts-ignore
import * as pdfParseModule from "pdf-parse";
const pdfParse = pdfParseModule.default || pdfParseModule;
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), "patrimonio_v2.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = DELETE"); // Avoid WAL mode issues in some environments

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL, -- 'expense' or 'income'
    is_system INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS global_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT -- icon name or image url
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS supplier_categories (
    supplier_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (supplier_id, category_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    initial_patrimony REAL NOT NULL,
    okr_min REAL NOT NULL,
    okr_ambitious REAL NOT NULL,
    daily_spent_default REAL NOT NULL,
    selic_tax REAL NOT NULL,
    is_current INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    value REAL NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    source_id TEXT NOT NULL,
    supplier_id TEXT,
    card_id TEXT,
    date TEXT NOT NULL,
    is_mandatory INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    remaining_recurrence INTEGER DEFAULT NULL,
    is_auto INTEGER DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS transaction_categories (
    transaction_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (transaction_id, category_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS aliases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    supplier_id TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS alias_categories (
    alias_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (alias_id, category_id),
    FOREIGN KEY (alias_id) REFERENCES aliases(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

// Migrations for existing tables
try {
  db.prepare("ALTER TABLE transactions ADD COLUMN supplier_id TEXT").run();
  console.log("Successfully added supplier_id to transactions");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("supplier_id already exists in transactions");
  } else {
    console.error("Migration error (transactions):", e.message);
  }
}
try {
  db.prepare("ALTER TABLE aliases ADD COLUMN supplier_id TEXT").run();
  console.log("Successfully added supplier_id to aliases");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("supplier_id already exists in aliases");
  } else {
    console.error("Migration error (aliases):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE categories ADD COLUMN is_system INTEGER DEFAULT 0").run();
  console.log("Successfully added is_system to categories");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("is_system already exists in categories");
  } else {
    console.error("Migration error (categories):", e.message);
  }
}
try {
  db.prepare("ALTER TABLE transactions ADD COLUMN card_id TEXT REFERENCES cards(id) ON DELETE RESTRICT").run();
  console.log("Successfully added card_id to transactions");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("card_id already exists in transactions");
  } else {
    console.error("Migration error (transactions card_id):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE transactions ADD COLUMN is_recurring INTEGER DEFAULT 0").run();
  console.log("Successfully added is_recurring to transactions");
} catch (e: any) {
  if (!e.message.includes("duplicate column name")) console.error("Migration error (is_recurring):", e.message);
}

try {
  db.prepare("ALTER TABLE transactions ADD COLUMN remaining_recurrence INTEGER DEFAULT NULL").run();
  console.log("Successfully added remaining_recurrence to transactions");
} catch (e: any) {
  if (!e.message.includes("duplicate column name")) console.error("Migration error (remaining_recurrence):", e.message);
}

try {
  const tableInfo = db.prepare("PRAGMA table_info(transactions)").all() as any[];
  if (tableInfo.some(col => col.name === 'is_non_recurring_mandatory')) {
    db.prepare("UPDATE transactions SET is_recurring = 0 WHERE is_mandatory = 1 AND is_non_recurring_mandatory = 1").run();
    db.prepare("UPDATE transactions SET is_recurring = 1 WHERE is_mandatory = 1 AND is_non_recurring_mandatory = 0").run();
    db.prepare("ALTER TABLE transactions DROP COLUMN is_non_recurring_mandatory").run();
    console.log("Successfully migrated and dropped is_non_recurring_mandatory");
  }
} catch (e: any) {
  console.error("Migration data error:", e.message);
}

try {
  db.prepare("ALTER TABLE reports ADD COLUMN projected_surplus REAL").run();
  db.prepare("ALTER TABLE reports ADD COLUMN projection_date TEXT").run();
  db.prepare("ALTER TABLE reports ADD COLUMN projection_reason TEXT").run();
  console.log("Successfully added projection columns to reports");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("projection columns already exist in reports");
  } else {
    console.error("Migration error (reports projection):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE reports ADD COLUMN is_current INTEGER DEFAULT 0").run();
  console.log("Successfully added is_current to reports");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("is_current already exists in reports");
  } else {
    console.error("Migration error (reports is_current):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE transactions ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT").run();
  console.log("Successfully added category_id to transactions");
  const txs = db.prepare("SELECT DISTINCT transaction_id, category_id FROM transaction_categories GROUP BY transaction_id").all() as any[];
  const update = db.prepare("UPDATE transactions SET category_id = ? WHERE id = ?");
  db.transaction(() => {
    for (const t of txs) {
      update.run(t.category_id, t.transaction_id);
    }
  })();
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("category_id already exists in transactions");
  } else {
    console.error("Migration error (transactions category_id):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE suppliers ADD COLUMN expense_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL").run();
  db.prepare("ALTER TABLE suppliers ADD COLUMN income_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL").run();
  db.prepare("ALTER TABLE suppliers ADD COLUMN is_system INTEGER DEFAULT 0").run();
  console.log("Successfully added expense, income categories and is_system to suppliers");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("Category columns already exist in suppliers");
  } else {
    console.error("Migration error (suppliers categories):", e.message);
  }
}

try {
  db.prepare("ALTER TABLE transactions ADD COLUMN is_auto INTEGER DEFAULT 0").run();
  console.log("Successfully added is_auto to transactions");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("is_auto already exists in transactions");
  } else {
    console.error("Migration error (transactions is_auto):", e.message);
  }
}

async function getBase64FromUrl(url: string): Promise<string> {
  if (url.startsWith("data:image")) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not fetch image");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/png";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("Error converting to base64:", e);
    return url; // Fallback to original URL
  }
}

function propagateRecurringTransactions(startReportId: string) {
  const startReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(startReportId) as any;
  if (!startReport) return;

  const allReports = db.prepare("SELECT * FROM reports ORDER BY year ASC, month ASC").all() as any[];
  const startIdx = allReports.findIndex(r => r.id === startReport.id);
  if (startIdx === -1 || startIdx === allReports.length - 1) return;

  const subsequentReports = allReports.slice(startIdx + 1);

  const runPropagate = db.transaction(() => {
    let prevReportId = startReport.id;

    for (const report of subsequentReports) {
      db.prepare(`
        DELETE FROM transaction_categories 
        WHERE transaction_id IN (SELECT id FROM transactions WHERE report_id = ? AND is_auto = 1)
      `).run(report.id);

      db.prepare(`
        DELETE FROM transactions 
        WHERE report_id = ? AND is_auto = 1
      `).run(report.id);

      const recurringTransactions = db.prepare(`
        SELECT * FROM transactions 
        WHERE report_id = ? AND is_recurring = 1
      `).all(prevReportId) as any[];

      for (const item of recurringTransactions) {
        const rem = item.remaining_recurrence;

        // se for uma despesa discricionária recorrente sem número definido de ocorrências, não cria/propaga
        if (item.type === 'expense' && !item.is_mandatory && (rem === null || rem === undefined || rem <= 0)) {
          continue;
        }

        if (rem !== null && rem !== undefined && rem > 0) {
          if (rem === 1) {
            continue;
          }
        }

        const transId = uuidv4();
        const targetRem = (rem !== null && rem !== undefined && rem > 1) ? rem - 1 : null;

        db.prepare(`
          INSERT INTO transactions (
            id, report_id, value, type, source_id, date, 
            is_mandatory, is_recurring, remaining_recurrence, 
            supplier_id, card_id, category_id, is_auto
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          transId,
          report.id,
          item.value,
          item.type,
          item.source_id,
          report.start_date,
          item.is_mandatory ? 1 : 0,
          1,
          targetRem,
          item.supplier_id || null,
          item.card_id || null,
          item.category_id || null
        );

        if (item.category_id) {
          db.prepare("INSERT INTO transaction_categories (transaction_id, category_id) VALUES (?, ?)").run(transId, item.category_id);
        }
      }

      prevReportId = report.id;
    }
  });

  runPropagate();
}

// Seed default data if empty
const seed = async () => {
  // Update PIX icon for existing installations
  db.prepare("UPDATE sources SET icon = ? WHERE name = 'PIX'").run("https://raw.githubusercontent.com/filipe-ferreira/PIX-icon/master/pix.svg");
  const categoriesCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
  if (categoriesCount.count === 0) {
    const seedCategories = [
      { name: "OUTRAS DESPESAS", icon: "Package", type: "expense", is_system: 1 },
      { name: "OUTRAS RECEITAS", icon: "TrendingUp", type: "income", is_system: 1 },
      { name: "RUA", icon: "Navigation", type: "expense", is_system: 0 },
      { name: "STREAMING", icon: "Play", type: "expense", is_system: 0 },
      { name: "PESSOAL", icon: "User", type: "expense", is_system: 0 },
      { name: "CASA", icon: "Home", type: "expense", is_system: 0 },
      { name: "MERCADO", icon: "ShoppingCart", type: "expense", is_system: 0 },
      { name: "DELIVERY/ALIMENTAÇÃO", icon: "Utensils", type: "expense", is_system: 0 },
      { name: "GATOS", icon: "Cat", type: "expense", is_system: 0 },
      { name: "SALÁRIO", icon: "Briefcase", type: "income", is_system: 0 },
      { name: "BENEFÍCIOS", icon: "Gift", type: "income", is_system: 0 },
      { name: "EXTRAS", icon: "PlusCircle", type: "income", is_system: 0 },
      { name: "ESTÉTICA", icon: "Eye", type: "expense", is_system: 0 },
      { name: "ACADEMIA", icon: "Dumbbell", type: "expense", is_system: 0 },
      { name: "JOGOS", icon: "Rocket", type: "expense", is_system: 0 },
      { name: "CARRO", icon: "Car", type: "expense", is_system: 0 },
      { name: "FARMÁCIA", icon: "Heart", type: "expense", is_system: 0 },
      { name: "BOLETOS", icon: "CreditCard", type: "expense", is_system: 0 },
      { name: "ALUGUEL", icon: "DollarSign", type: "expense", is_system: 0 },
    ];

    const insertCat = db.prepare("INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, ?)");
    seedCategories.forEach(c => insertCat.run(uuidv4(), c.name, c.icon, c.type, c.is_system));

    const defaultSources = [
      { name: "PIX", icon: "https://raw.githubusercontent.com/filipe-ferreira/PIX-icon/master/pix.svg" },
      { name: "TICKET", icon: "Ticket" },
      { name: "CARTÃO", icon: "CreditCard" }
    ];
    const insertSource = db.prepare("INSERT INTO sources (id, name, icon) VALUES (?, ?, ?)");
    defaultSources.forEach(s => insertSource.run(uuidv4(), s.name, s.icon));

    const insertConfig = db.prepare("INSERT INTO global_config (key, value) VALUES (?, ?)");
    insertConfig.run("daily_spent_avg", "100"); // Standard historical avg
    insertConfig.run("okr_min_default", "3000");
    insertConfig.run("okr_ambitious_default", "5000");
    insertConfig.run("cycle_day_default", "25");
    insertConfig.run("daily_spent_estimate_default", "100");
    insertConfig.run("goal_target_default", "1000000");

    const salaryCat = db.prepare("SELECT id FROM categories WHERE name = 'SALÁRIO' LIMIT 1").get() as { id: string };
    const benefitCat = db.prepare("SELECT id FROM categories WHERE name = 'BENEFÍCIOS' LIMIT 1").get() as { id: string };
    const pixSource = db.prepare("SELECT id FROM sources WHERE name = 'PIX' LIMIT 1").get() as { id: string };
    const ticketSource = db.prepare("SELECT id FROM sources WHERE name = 'TICKET' LIMIT 1").get() as { id: string };

    const defaultIncomes = [
      { name: "Salário Base", value: 9500, source_id: pixSource.id, category_id: salaryCat.id },
      { name: "Benefício Alimentação", value: 1100, source_id: ticketSource.id, category_id: benefitCat.id }
    ];
    insertConfig.run("default_incomes", JSON.stringify(defaultIncomes));
  }

  // Extra seed check for Outras categories if table was not empty
  const systemCats = db.prepare("SELECT count(*) as count FROM categories WHERE is_system = 1").get() as { count: number };
  if (systemCats.count < 2) {
    const required = [
      { name: "OUTRAS DESPESAS", icon: "Package", type: "expense", is_system: 1 },
      { name: "OUTRAS RECEITAS", icon: "TrendingUp", type: "income", is_system: 1 }
    ];
    const insertCat = db.prepare("INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, ?)");
    required.forEach(r => {
      const exists = db.prepare("SELECT id FROM categories WHERE name = ? AND type = ?").get(r.name, r.type);
      if (!exists) {
        insertCat.run(uuidv4(), r.name, r.icon, r.type, r.is_system);
      } else {
        db.prepare("UPDATE categories SET is_system = 1 WHERE name = ? AND type = ?").run(r.name, r.type);
      }
    });
  }

  // Seed default system supplier
  const defaultExpenseCat = db.prepare("SELECT id FROM categories WHERE name = 'OUTRAS DESPESAS'").get() as { id: string };
  const defaultIncomeCat = db.prepare("SELECT id FROM categories WHERE name = 'OUTRAS RECEITAS'").get() as { id: string };
  const existingSupplier = db.prepare("SELECT id FROM suppliers WHERE name = 'FORNECEDOR PADRÃO'").get() as { id: string };
  if (!existingSupplier) {
    db.prepare("INSERT INTO suppliers (id, name, expense_category_id, income_category_id, is_system) VALUES (?, ?, ?, ?, ?)").run(
      uuidv4(), "FORNECEDOR PADRÃO", defaultExpenseCat?.id || null, defaultIncomeCat?.id || null, 1
    );
  } else {
    db.prepare("UPDATE suppliers SET is_system = 1, expense_category_id = ?, income_category_id = ? WHERE id = ?").run(
      defaultExpenseCat?.id || null, defaultIncomeCat?.id || null, existingSupplier.id
    );
  }

  // Seed default alias "george" if no aliases exist
  const aliasesCount = db.prepare("SELECT count(*) as count FROM aliases").get() as { count: number };
  if (aliasesCount.count === 0) {
    db.prepare("INSERT INTO aliases (id, name) VALUES (?, ?)").run(uuidv4(), "george");
  }

  // Seed default cards
  const cardsCount = db.prepare("SELECT count(*) as count FROM cards").get() as { count: number };
  if (cardsCount.count === 0) {
    db.prepare("DELETE FROM cards").run();
    const defaultCards = [
      { name: "ITAU", logo: "https://logos.hunter.io/itau.com.br" },
      { name: "MERCADO PAGO", logo: "https://logos.hunter.io/mercadopago.com.br" },
      { name: "NUBANK", logo: "https://logos.hunter.io/nubank.com.br" },
      { name: "C6 BANK", logo: "https://logos.hunter.io/c6bank.com.br" },
      { name: "BRADESCO", logo: "https://logos.hunter.io/bradesco.com.br" },
      { name: "SANTANDER", logo: "https://logos.hunter.io/santander.com.br" },
      { name: "INTER", logo: "https://logos.hunter.io/bancointer.com.br" },
      { name: "CAIXA", logo: "https://logos.hunter.io/caixa.gov.br" },
      { name: "BANCO DO BRASIL", logo: "https://logos.hunter.io/bb.com.br" }
    ];
    const insertCard = db.prepare("INSERT INTO cards (id, name, logo) VALUES (?, ?, ?)");
    for (const c of defaultCards) {
      const base64 = await getBase64FromUrl(c.logo);
      insertCard.run(uuidv4(), c.name, base64);
    }
  }
};

async function startServer() {
  await seed();
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  const PORT = 3000;

  // --- API Routes ---

  app.get("/api/config", (req, res) => {
    const rows = db.prepare("SELECT * FROM global_config").all() as { key: string, value: string }[];
    const config = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(config);
  });

  app.post("/api/config", (req, res) => {
    const insert = db.prepare("INSERT OR REPLACE INTO global_config (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'object') {
        insert.run(key, JSON.stringify(value));
      } else {
        insert.run(key, String(value));
      }
    }
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(DISTINCT tc.transaction_id) FROM transaction_categories tc WHERE tc.category_id = c.id) as transaction_count,
               (SELECT COUNT(DISTINCT sc.supplier_id) FROM supplier_categories sc WHERE sc.category_id = c.id) as supplier_count
        FROM categories c
        ORDER BY c.name
      `).all();
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/categories", (req, res) => {
    const { name, icon, type } = req.body;
    const finalName = name.toUpperCase();
    const id = uuidv4();
    try {
      db.prepare("INSERT INTO categories (id, name, icon, type) VALUES (?, ?, ?, ?)").run(id, finalName, icon, type);
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/categories/:id", (req, res) => {
    const { name, icon } = req.body;
    const finalName = name.toUpperCase();
    try {
      const category = db.prepare("SELECT is_system FROM categories WHERE id = ?").get(req.params.id) as { is_system: number };
      if (category?.is_system) {
        return res.status(403).json({ error: "Categorias do sistema não podem ser editadas." });
      }
      db.prepare("UPDATE categories SET name = ?, icon = ? WHERE id = ?").run(finalName, icon, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    try {
      const category = db.prepare("SELECT is_system FROM categories WHERE id = ?").get(req.params.id) as { is_system: number };
      if (category?.is_system) {
        return res.status(403).json({ error: "Categorias do sistema não podem ser removidas." });
      }
      const counts = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM transaction_categories WHERE category_id = ?) as transaction_count,
          (SELECT COUNT(*) FROM supplier_categories WHERE category_id = ?) as supplier_count
      `).get(req.params.id, req.params.id) as { transaction_count: number, supplier_count: number };

      if (counts.transaction_count > 0 || counts.supplier_count > 0) {
        return res.status(400).json({
          error: "Não é possível excluir esta categoria pois ela está vinculada a transações ou fornecedores."
        });
      }

      db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/sources", (req, res) => {
    const rows = db.prepare("SELECT * FROM sources ORDER BY name").all();
    res.json(rows);
  });

  app.get("/api/reports", (req, res) => {
    const rows = db.prepare("SELECT * FROM reports ORDER BY year DESC, month DESC").all();
    res.json(rows);
  });

  app.get("/api/dashboard/history", (req, res) => {
    try {
      const reports = db.prepare("SELECT * FROM reports ORDER BY year ASC, month ASC").all() as any[];
      const history = reports.map(r => {
        const transactions = db.prepare("SELECT * FROM transactions WHERE report_id = ?").all(r.id) as any[];

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
        const fixedExpenses = transactions.filter(t => t.type === 'expense' && t.is_mandatory === 1).reduce((sum, t) => sum + t.value, 0);
        const discretionaryExpenses = totalExpense - fixedExpenses;
        const realSurplus = totalIncome - totalExpense;

        return {
          id: r.id,
          month: r.month,
          year: r.year,
          fixed: fixedExpenses,
          discretionary: discretionaryExpenses,
          surplus: realSurplus,
          name: `${r.month + 1}/${r.year}`
        };
      });
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/reports/:id", (req, res) => {
    const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id) as any;
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Get transactions for this report
    const transactions = db.prepare(`
      SELECT t.*, s.name as supplier_name, s.logo as supplier_logo, c.name as card_name, c.logo as card_logo
      FROM transactions t 
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      LEFT JOIN cards c ON t.card_id = c.id
      WHERE t.report_id = ?
      ORDER BY t.date DESC
    `).all(req.params.id);

    const formattedTransactions = (transactions as any[]).map(t => ({
      ...t
    }));

    res.json({ ...report, transactions: formattedTransactions });
  });

  app.post("/api/reports/:id/calculate-projection", async (req, res) => {
    const reportId = req.params.id;
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
      const openai = new OpenAI({ apiKey });

      const currentReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId) as any;
      if (!currentReport) return res.status(404).json({ error: "Report not found" });

      // Get last 5 reports before this one (including this one, total up to last 6)
      const allReports = db.prepare(`
        SELECT * FROM reports 
        WHERE (year < ?) OR (year = ? AND month <= ?)
        ORDER BY year DESC, month DESC 
        LIMIT 6
      `).all(currentReport.year, currentReport.year, currentReport.month) as any[];

      const contextData = allReports.map(r => {
        const trans = db.prepare(`
          SELECT type, SUM(value) as total 
          FROM transactions 
          WHERE report_id = ? 
          GROUP BY type
        `).all(r.id) as any[];

        return {
          month: r.month + 1,
          year: r.year,
          income: trans.find(t => t.type === 'income')?.total || 0,
          expense: trans.find(t => t.type === 'expense')?.total || 0,
          isCurrent: r.id === reportId
        };
      });

      const today = new Date().toISOString().split('T')[0];

      const prompt = `Você é um Analista Financeiro Preditivo. 
Sua tarefa é calcular a SOBRA PROJETADA (Projected Surplus) para o final do período do relatório atual.

DADOS DO RELATÓRIO ATUAL:
- Início: ${currentReport.start_date}
- Fim: ${currentReport.end_date}
- Data de Hoje: ${today}

HISTÓRICO RECENTE (Últimos meses):
${JSON.stringify(contextData, null, 2)}

REGRAS DE CÁLCULO:
1. Considere o que já foi gasto e recebido no mês atual até hoje.
2. Com base no histórico dos meses anteriores e na média de gastos diários, projete os gastos para os dias restantes até o fim do período (${currentReport.end_date}).
3. Subtraia a projeção de gastos do total de receitas esperadas.
4. Retorne um valor numérico para a sobra projetada e uma breve explicação do motivo.

Responda APENAS com um JSON no formato:
{
  "projectedSurplus": 1234.56,
  "reason": "Explicação curta baseada na média de gastos x dias restantes."
}`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Você é um especialista em projeção financeira baseada em séries históricas curtas." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(aiResponse.choices[0].message.content || '{}');

      db.prepare(`
        UPDATE reports 
        SET projected_surplus = ?, projection_date = ?, projection_reason = ? 
        WHERE id = ?
      `).run(result.projectedSurplus, today, result.reason, reportId);

      res.json({ ...result, projection_date: today });

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/reports/:id", (req, res) => {
    const { start_date, end_date, selic_tax, initial_patrimony, okr_min, okr_ambitious } = req.body;
    try {
      db.prepare(`
        UPDATE reports 
        SET start_date = ?, end_date = ?, selic_tax = ?, initial_patrimony = ?, okr_min = ?, okr_ambitious = ?
        WHERE id = ?
      `).run(start_date, end_date, selic_tax, initial_patrimony, okr_min, okr_ambitious, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/reports/:id/activate", (req, res) => {
    const reportId = req.params.id;
    try {
      const getReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId) as any;
      if (!getReport) {
        return res.status(404).json({ error: "Relatório não encontrado" });
      }

      const start = new Date(getReport.start_date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(getReport.end_date);
      end.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isInPeriod = today.getTime() >= start.getTime() && today.getTime() <= end.getTime();

      if (!isInPeriod) {
        return res.status(400).json({
          error: "Não é possível definir este relatório como 'EM CURSO' porque o seu período de vigência não inclui o dia de hoje."
        });
      }

      db.transaction(() => {
        db.prepare("UPDATE reports SET is_current = 0").run();
        db.prepare("UPDATE reports SET is_current = 1 WHERE id = ?").run(reportId);
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/reports/:id/deactivate", (req, res) => {
    const reportId = req.params.id;
    try {
      db.prepare("UPDATE reports SET is_current = 0 WHERE id = ?").run(reportId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/reports", (req, res) => {
    const { month, year, start_date, end_date, initial_patrimony, okr_min, okr_ambitious, daily_spent_default, selic_tax } = req.body;
    const id = uuidv4();

    try {
      db.prepare(`
        INSERT INTO reports (id, month, year, start_date, end_date, initial_patrimony, okr_min, okr_ambitious, daily_spent_default, selic_tax)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, month, year, start_date, end_date, initial_patrimony, okr_min, okr_ambitious, daily_spent_default, selic_tax);

      // Auto-recreate recurring transactions (incomes and expenses) from the previous month's report
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;

      const prevReport = db.prepare("SELECT * FROM reports WHERE month = ? AND year = ?").get(prevMonth, prevYear) as any;
      if (prevReport) {
        const recurringTransactions = db.prepare(`
          SELECT * FROM transactions 
          WHERE report_id = ? AND is_recurring = 1
        `).all(prevReport.id) as any[];

        recurringTransactions.forEach(item => {
          const rem = item.remaining_recurrence;

          // se for uma despesa discricionária recorrente sem número definido de ocorrências, não cria/propaga
          if (item.type === 'expense' && !item.is_mandatory && (rem === null || rem === undefined || rem <= 0)) {
            return; // skip creation
          }

          // se a transacao tiver um número definido de ocorrencias(maior que 0)
          if (rem !== null && rem !== undefined && rem > 0) {
            // caso o total de ocorrencias era 1 então não terá mais essa transacao no novo relatório
            if (rem === 1) {
              return; // skip creation
            }
          }

          const transId = uuidv4();
          const targetRem = (rem !== null && rem !== undefined && rem > 1) ? rem - 1 : null;

          db.prepare(`
            INSERT INTO transactions (
              id, report_id, value, type, source_id, date, 
              is_mandatory, is_recurring, remaining_recurrence, 
              supplier_id, card_id, category_id, is_auto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(
            transId,
            id,
            item.value,
            item.type,
            item.source_id,
            start_date, // primeiro dia do período do relatório
            item.is_mandatory ? 1 : 0,
            1, // is_recurring
            targetRem,
            item.supplier_id || null,
            item.card_id || null,
            item.category_id || null
          );

          if (item.category_id) {
            db.prepare("INSERT INTO transaction_categories (transaction_id, category_id) VALUES (?, ?)").run(transId, item.category_id);
          }
        });
      }

      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/reports/:id", (req, res) => {
    try {
      const allReports = db.prepare("SELECT id FROM reports ORDER BY year ASC, month ASC").all() as any[];
      if (allReports.length > 2) {
        const oldestId = allReports[0].id;
        const newestId = allReports[allReports.length - 1].id;
        const targetId = req.params.id;
        if (targetId !== oldestId && targetId !== newestId) {
          return res.status(400).json({ error: "Apenas relatórios das pontas (o mais antigo ou o mais recente) podem ser removidos." });
        }
      }
      db.prepare("DELETE FROM reports WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { report_id, value, type, source_id, date, categories, category_id, is_mandatory, is_recurring, remaining_recurrence, supplier_id, card_id, propagate } = req.body;
    const id = uuidv4();
    let finalCatId = category_id;
    if (!finalCatId && categories && categories.length > 0) finalCatId = categories[0];

    const insert = db.transaction(() => {
      db.prepare("INSERT INTO transactions (id, report_id, value, type, source_id, date, is_mandatory, is_recurring, remaining_recurrence, supplier_id, card_id, category_id, is_auto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)")
        .run(id, report_id, value, type, source_id, date, is_mandatory ? 1 : 0, is_recurring ? 1 : 0, remaining_recurrence !== undefined ? remaining_recurrence : null, supplier_id, card_id || null, finalCatId);
    });

    try {
      insert();
      if (propagate && report_id) {
        propagateRecurringTransactions(report_id);
      }
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    try {
      const transRow = db.prepare("SELECT report_id FROM transactions WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);

      const propagate = req.query.propagate === "true" || req.query.propagate === "1" || req.body?.propagate === true;
      if (propagate && transRow) {
        propagateRecurringTransactions(transRow.report_id);
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Delete error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/transactions/bulk", (req, res) => {
    const { transactions } = req.body;
    console.log("Receiving bulk insert:", JSON.stringify(transactions, null, 2));

    try {
      const performBulkInsert = db.transaction(() => {
        const categoriesData = db.prepare("SELECT id, name, type FROM categories").all() as any[];
        const validCatsSet = new Set(categoriesData.map(c => c.id));
        const defaultExpenseCatId = categoriesData.find(c => c.name === 'OUTRAS DESPESAS')?.id || null;
        const defaultIncomeCatId = categoriesData.find(c => c.name === 'OUTRAS RECEITAS')?.id || null;
        const suppliers = db.prepare("SELECT * FROM suppliers").all() as any[];

        for (const t of transactions) {
          const { report_id, value, type, source_id, date, categories, category_id, is_mandatory, is_recurring, remaining_recurrence, alias, supplier_id, card_id } = t;
          const id = uuidv4();

          let finalCatId = category_id;
          if (!finalCatId && categories && categories.length > 0) finalCatId = categories[0];
          if (!validCatsSet.has(finalCatId)) finalCatId = null;

          let finalSupplierId = supplier_id;

          // If no supplier_id provided, try to find by alias or create one
          if (!finalSupplierId && alias && alias.name) {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedName = normalize(alias.name);

            // Check existing aliases to find a supplier
            const aliasRow = db.prepare("SELECT supplier_id FROM aliases WHERE LOWER(name) = ? LIMIT 1").get(alias.name.toLowerCase()) as any;
            if (aliasRow?.supplier_id) {
              finalSupplierId = aliasRow.supplier_id;
            } else {
              // Try to find supplier directly
              const supplierMatch = suppliers.find(s => normalize(s.name) === normalizedName);
              if (supplierMatch) {
                finalSupplierId = supplierMatch.id;
              } else {
                // Create new supplier
                finalSupplierId = uuidv4();
                db.prepare("INSERT INTO suppliers (id, name, expense_category_id, income_category_id, is_system) VALUES (?, ?, ?, ?, ?)").run(
                  finalSupplierId, alias.name.toUpperCase(), defaultExpenseCatId, defaultIncomeCatId, 0
                );
                suppliers.push({ id: finalSupplierId, name: alias.name.toUpperCase() }); // add to cache

                // Update the specific category if we have one
                if (finalCatId) {
                  if (type === 'income') {
                    db.prepare("UPDATE suppliers SET income_category_id = ? WHERE id = ?").run(finalCatId, finalSupplierId);
                  } else {
                    db.prepare("UPDATE suppliers SET expense_category_id = ? WHERE id = ?").run(finalCatId, finalSupplierId);
                  }
                }
              }
              // Create alias linking to this supplier
              db.prepare("INSERT OR IGNORE INTO aliases (id, name, supplier_id) VALUES (?, ?, ?)").run(uuidv4(), alias.name.toUpperCase(), finalSupplierId);
            }
          }

          // Insert transaction
          db.prepare("INSERT INTO transactions (id, report_id, value, type, source_id, date, is_mandatory, is_recurring, remaining_recurrence, supplier_id, card_id, category_id, is_auto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)")
            .run(id, report_id, value, type, source_id, date, is_mandatory ? 1 : 0, is_recurring ? 1 : 0, remaining_recurrence !== undefined ? remaining_recurrence : null, finalSupplierId, card_id || null, finalCatId);
        }
      });

      performBulkInsert();
      res.json({ success: true });
    } catch (e: any) {
      console.error("Bulk Insert error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gemini/extract-transactions", async (req, res) => {
    try {
      const { imageParams, reportStartDate, reportEndDate, importType } = req.body;

      if (process.env.MOCK_AI === "true") {
        console.log("MOCK_AI: Returning mock transactions");
        const mockTransactions = [
          {
            "type": "expense",
            "date": "2026-05-02",
            "time": "",
            "value": 46.9,
            "aliasName": "Disney plussao paulobra",
            "supplier_id": "a1742a9e-9be4-40df-b602-8ad4ba4985d8",
            "category_ids": [
              "417ad6ae-9334-471d-bb4f-227b25a57648"
            ],
            "is_potential_reversal": false,
            "reversal_reason": ""
          },
          {
            "type": "expense",
            "date": "2026-05-02",
            "time": "",
            "value": 18.66,
            "aliasName": "Vania delicatessenamargos abra",
            "supplier_id": "37f4b6d0-e546-4830-90b6-70a2faedd808",
            "category_ids": [
              "32b29884-aa16-41f3-b693-b3055be0710a",
              "f824269f-f781-4cdc-8578-684503231e71"
            ],
            "is_potential_reversal": false,
            "reversal_reason": ""
          },
          {
            "type": "expense",
            "date": "2026-05-02",
            "time": "",
            "value": 44,
            "aliasName": "Georgetesampaio dea margosabra",
            "supplier_id": "",
            "category_ids": [],
            "is_potential_reversal": false,
            "reversal_reason": ""
          },
          {
            "type": "expense",
            "date": "2026-05-02",
            "time": "",
            "value": 63.2,
            "aliasName": "Luan fonseca oliveiraamargosabra",
            "supplier_id": "a3a52ca4-fa3e-4d28-8140-d78324aa6f88",
            "category_ids": [
              "e035afc8-4377-421b-a3f7-ecbd4c13e0ff"
            ],
            "is_potential_reversal": false,
            "reversal_reason": ""
          },
          {
            "type": "expense",
            "date": "2026-05-02",
            "time": "",
            "value": 40,
            "aliasName": "Point das raaa? esamargosabra",
            "supplier_id": "c8139775-2a4c-417c-9e36-96de1b47cb76",
            "category_ids": [
              "8825a88f-fead-47c5-8a59-b00bbe97429b"
            ],
            "is_potential_reversal": false,
            "reversal_reason": ""
          },
          {
            "type": "expense",
            "date": "2026-05-03",
            "time": "",
            "value": 9.9,
            "aliasName": "Ec *melimaisosascobra",
            "supplier_id": "d4c6dd3b-e1bc-4539-b435-6f357fcda6b9",
            "category_ids": [
              "090df64e-c9f7-4c2a-8adb-462b5efd5ce5"
            ],
            "is_potential_reversal": false,
            "reversal_reason": ""
          }
        ];
        return res.json(mockTransactions);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
      }

      const openai = new OpenAI({ apiKey });

      // Fetch categories and suppliers to feed to OpenAI
      const categories = db.prepare("SELECT * FROM categories").all() as any[];
      const suppliersRows = db.prepare(`
        SELECT s.id, s.name, GROUP_CONCAT(DISTINCT sc.category_id) as category_ids, GROUP_CONCAT(DISTINCT a.name) as aliases
        FROM suppliers s
        LEFT JOIN supplier_categories sc ON s.id = sc.supplier_id
        LEFT JOIN aliases a ON s.id = a.supplier_id
        GROUP BY s.id
      `).all() as any[];

      const suppliers = suppliersRows.map(r => ({
        ...r,
        category_ids: r.category_ids ? r.category_ids.split(",") : [],
        aliases: r.aliases ? r.aliases.split(",") : []
      }));

      // Step 1: Raw Extraction (Directly from file content)
      let typeInstruction = "extraia as transações (entradas e saídas).";
      if (importType === "credit_card") {
        typeInstruction = "este é um extrato de cartão de crédito. Gere APENAS transações do tipo 'expense'. IGNORE pagamentos de fatura ou fechamentos. Extraia os valores exatamente como aparecem.";
      } else if (importType === "bank_statement") {
        typeInstruction = "este é um extrato bancário. Identifique claramente as entradas (income) e saídas (expense).";
      }

      const rawExtractionPrompt = `Você é um extrator de dados financeiros especialista em extrair transações.
Analise as imagens/texto e extraia as transações encontradas.
REGRAS:
- Extraia o valor BRUTO exatamente como está no documento.
- Extraia o aliasName (descrição) contendo APENAS o nome do recebedor ou devedor (pessoa ou empresa). NÃO inclua ações ou tipos de transação como "Pix enviado", "Pix recebido", "Transação realizada" ou similares.
- Identifique a data (date) no formato YYYY-MM-DD. Se a data não estiver explícita ao lado da transação (ex: apenas dia e mês), utilize o período de referência para inferir o ano/mês correto. Garanta que todas as transações tenham uma data válida dentro do período.

Retorne no formato JSON sugerido. Periodo de referência: ${reportStartDate || 'N/A'} até ${reportEndDate || 'N/A'}.`;

      let extractedTextContent = "";
      const openAiImageParams = [];

      for (const img of imageParams) {
        if (img.inlineData) {
          const mime = img.inlineData.mimeType.toLowerCase();
          const buffer = Buffer.from(img.inlineData.data, "base64");

          if (mime.includes("pdf")) {
            const data = await pdfParse(buffer);
            extractedTextContent += `\n\n--- Texto extraído de Arquivo PDF (${img.inlineData.fileName || 'documento'}) ---\n${data.text}`;
          } else if (mime.includes("wordprocessingml") || mime.includes("msword")) {
            const result = await mammoth.extractRawText({ buffer });
            extractedTextContent += `\n\n--- Texto extraído de Arquivo Word (${img.inlineData.fileName || 'documento'}) ---\n${result.value}`;
          } else if (mime.includes("spreadsheetml") || mime.includes("ms-excel") || mime.includes("csv")) {
            const workbook = xlsx.read(buffer, { type: "buffer" });
            let sheetText = "";
            workbook.SheetNames.forEach(sheetName => {
              const csv = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
              sheetText += `\nPlanilha: ${sheetName}\n${csv}`;
            });
            extractedTextContent += `\n\n--- Texto extraído de Planilha/CSV (${img.inlineData.fileName || 'documento'}) ---\n${sheetText}`;
          } else if (mime.startsWith("image/")) {
            openAiImageParams.push({
              type: "image_url",
              image_url: {
                url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`
              }
            });
          } else {
            extractedTextContent += `\n\n--- Texto bruto (${img.inlineData.fileName || 'documento'}) ---\n${buffer.toString("utf8")}`;
          }
        } else {
          openAiImageParams.push(img);
        }
      }

      const finalPrompt = rawExtractionPrompt + (extractedTextContent ? `\n\nConteúdo extraído em texto dos arquivos:\n${extractedTextContent}` : "");

      const extractionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              ...openAiImageParams,
              { type: "text", text: finalPrompt }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "raw_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["expense", "income"] },
                      date: { type: "string", description: "YYYY-MM-DD" },
                      value: { type: "number" },
                      aliasName: { type: "string" }
                    },
                    required: ["type", "date", "value", "aliasName"],
                    additionalProperties: false
                  }
                }
              },
              required: ["transactions"],
              additionalProperties: false
            }
          }
        }
      });

      const initialText = extractionResponse.choices[0]?.message?.content;
      if (!initialText) {
        throw new Error("No response from AI");
      }

      const extracted = JSON.parse(initialText);

      // Step 2: Special Identification (Installments & Reversals)
      const specialPrompt = `Você é um Auditor de Fraudes e Parcelamentos.
Analise as transações e identifique:
1. Compras Parceladas: Se a descrição sugere parcelas (ex: "1/10", "em 5x", "parcela 2"), indique a quantidade total de parcelas no campo 'installments_count'.
2. Estornos/Cancelamentos: Se a transação for um crédito que anula uma despesa ou tiver termos como "ESTORNO", marque 'is_potential_reversal' como true.

Lista extraída:
${JSON.stringify(extracted.transactions, null, 2)}

Retorne o JSON com os campos adicionais 'installments_count' (inteiro, padrão 1) e 'is_potential_reversal' (boolean) e 'reversal_reason' (string).`;

      const specialResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você identifica padrões de parcelamento e estorno em descrições de faturas." },
          {
            role: "user",
            content: [
              ...openAiImageParams,
              { type: "text", text: specialPrompt }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "special_id",
            strict: true,
            schema: {
              type: "object",
              properties: {
                transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      date: { type: "string" },
                      value: { type: "number" },
                      aliasName: { type: "string" },
                      is_potential_reversal: { type: "boolean" },
                      reversal_reason: { type: "string" },
                      installments_count: { type: "number", description: "Quantidade total de parcelas se for parcelado. Default 1." }
                    },
                    required: ["type", "date", "value", "aliasName", "is_potential_reversal", "reversal_reason", "installments_count"],
                    additionalProperties: false
                  }
                }
              },
              required: ["transactions"],
              additionalProperties: false
            }
          }
        }
      });

      const finalAIResult = JSON.parse(specialResponse.choices[0].message.content || '{"transactions":[]}');

      // Final Enrichment & Logic in Code
      const normalize = (name: string) => {
        return name
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/Ç/g, "C")
          .trim();
      };

      const result = finalAIResult.transactions.map((t: any) => {
        const normalizedAlias = normalize(t.aliasName);

        // Calculate Parcel Value: Raw Value / Count
        const count = Math.max(1, t.installments_count || 1);
        const finalValue = t.value / count;

        // DB Mapping
        const foundAlias = db.prepare("SELECT supplier_id FROM aliases WHERE name = ?").get(normalizedAlias) as any;
        let supplier_id = "";
        let category_id = null;

        if (foundAlias?.supplier_id) {
          supplier_id = foundAlias.supplier_id;
          const sup = db.prepare("SELECT expense_category_id, income_category_id FROM suppliers WHERE id = ?").get(supplier_id) as any;
          if (sup) {
            category_id = t.type === 'expense' ? sup.expense_category_id : sup.income_category_id;
          }
        }

        return {
          ...t,
          time: "",
          aliasName: normalizedAlias,
          value: Number(finalValue.toFixed(2)),
          supplier_id,
          category_id,
          installments: count > 1 ? `${t.installments_count}x` : ""
        };
      });

      res.json(result);

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Something went wrong processing image" });
    }
  });

  // --- Alias Routes ---
  app.get("/api/aliases", (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT a.id, a.name, a.supplier_id
        FROM aliases a
        ORDER BY a.name
      `).all() as any[];
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/aliases/bulk", (req, res) => {
    const { mappings } = req.body; // Array of { name, supplier_id }
    try {
      const insert = db.transaction(() => {
        const stmt = db.prepare("INSERT INTO aliases (id, name, supplier_id) VALUES (?, ?, ?)");
        const update = db.prepare("UPDATE aliases SET supplier_id = ? WHERE name = ?");
        const check = db.prepare("SELECT id FROM aliases WHERE name = ?");

        for (const m of mappings) {
          const finalName = m.name.toUpperCase();
          const existing = check.get(finalName) as any;
          if (existing) {
            update.run(m.supplier_id || null, finalName);
          } else {
            stmt.run(uuidv4(), finalName, m.supplier_id || null);
          }
        }
      });
      insert();
      res.json({ success: true });
    } catch (e: any) {
      console.error("Bulk alias association error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/aliases", (req, res) => {
    const { name, supplier_id } = req.body;
    const finalName = name.toUpperCase();
    const id = uuidv4();
    try {
      db.prepare("INSERT INTO aliases (id, name, supplier_id) VALUES (?, ?, ?)").run(id, finalName, supplier_id || null);
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/aliases/:id", (req, res) => {
    const { name, supplier_id } = req.body;
    const finalName = name.toUpperCase();
    try {
      db.prepare("UPDATE aliases SET name = ?, supplier_id = ? WHERE id = ?").run(finalName, supplier_id || null, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/aliases/:id", (req, res) => {
    try {
      const alias = db.prepare("SELECT supplier_id FROM aliases WHERE id = ?").get(req.params.id) as { supplier_id: string };
      if (alias && alias.supplier_id) {
        const siblingCount = db.prepare("SELECT COUNT(*) as count FROM aliases WHERE supplier_id = ?").get(alias.supplier_id) as { count: number };
        if (siblingCount.count <= 1) {
          return res.status(400).json({ error: "O fornecedor associado deve ter pelo menos um pseudônimo. Adicione outro antes de remover este." });
        }
      }
      db.prepare("DELETE FROM aliases WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { value, source_id, date, categories, category_id, is_mandatory, is_recurring, remaining_recurrence, supplier_id, card_id, propagate } = req.body;
    let finalCatId = category_id;
    if (!finalCatId && categories && categories.length > 0) finalCatId = categories[0];

    const transRow = db.prepare("SELECT report_id FROM transactions WHERE id = ?").get(req.params.id) as any;

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE transactions 
        SET value = ?, source_id = ?, date = ?, is_mandatory = ?, is_recurring = ?, remaining_recurrence = ?, supplier_id = ?, card_id = ?, category_id = ?
        WHERE id = ?
      `).run(value, source_id, date, is_mandatory ? 1 : 0, is_recurring ? 1 : 0, remaining_recurrence !== undefined ? remaining_recurrence : null, supplier_id, card_id || null, finalCatId, req.params.id);
    });

    try {
      update();
      if (propagate && transRow) {
        propagateRecurringTransactions(transRow.report_id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Projection logic helper (can also be done frontend, but nice to have metadata)
  app.get("/api/stats/daily-spent", (req, res) => {
    const rows = db.prepare(`
      SELECT r.id, r.start_date, r.end_date, SUM(t.value) as total_spent, 
             (strftime('%J', r.end_date) - strftime('%J', r.start_date)) as days
      FROM reports r
      LEFT JOIN transactions t ON r.id = t.report_id AND t.type = 'expense'
      GROUP BY r.id
      ORDER BY r.year DESC, r.month DESC
    `).all();
    res.json(rows);
  });

  // --- Supplier Routes ---
  app.get("/api/suppliers", (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT s.*, 
               GROUP_CONCAT(DISTINCT a.id) as alias_ids,
               (SELECT COUNT(*) FROM transactions t WHERE t.supplier_id = s.id) as transaction_count
        FROM suppliers s
        LEFT JOIN aliases a ON s.id = a.supplier_id
        GROUP BY s.id
        ORDER BY s.name
      `).all() as any[];
      const suppliers = rows.map(r => ({
        ...r,
        alias_ids: r.alias_ids ? r.alias_ids.split(",") : [],
        category_ids: [] // DEPRECATED
      }));
      res.json(suppliers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper to normalize strings for comparison
  function normalizeSupplierName(name: string) {
    if (!name) return "";
    return name
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^A-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, " "); // Collapse multiple spaces
  }

  app.post("/api/suppliers", (req, res) => {
    const { name, logo, expense_category_id, income_category_id, category_ids, alias_ids, newAliases } = req.body;

    let finalExpenseCat = expense_category_id;
    let finalIncomeCat = income_category_id;

    // Fallback if frontend isn't updated yet to send new fields
    if (!finalExpenseCat && !finalIncomeCat && category_ids && category_ids.length > 0) {
      finalExpenseCat = category_ids[0]; // best effort fallback
    }

    const normName = normalizeSupplierName(name);
    const existingSuppliers = db.prepare("SELECT id, name FROM suppliers").all() as any[];
    for (const s of existingSuppliers) {
      if (normalizeSupplierName(s.name) === normName) {
        return res.status(400).json({ error: `Já existe um fornecedor cadastrado com o nome "${s.name}".` });
      }
    }

    const finalName = name.trim().toUpperCase();
    const id = uuidv4();
    const insert = db.transaction(() => {
      db.prepare("INSERT INTO suppliers (id, name, logo, expense_category_id, income_category_id) VALUES (?, ?, ?, ?, ?)")
        .run(id, finalName, logo, finalExpenseCat || null, finalIncomeCat || null);

      // Link existing aliases
      if (Array.isArray(alias_ids) && alias_ids.length > 0) {
        const updateAlias = db.prepare("UPDATE aliases SET supplier_id = ? WHERE id = ?");
        for (const aliasId of alias_ids) {
          updateAlias.run(id, aliasId);
        }
      }

      // Create new aliases
      if (Array.isArray(newAliases)) {
        const insertAlias = db.prepare("INSERT INTO aliases (id, name, supplier_id) VALUES (?, ?, ?)");
        for (const aliasName of newAliases) {
          insertAlias.run(uuidv4(), aliasName.toUpperCase(), id);
        }
      }
    });

    try {
      insert();
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { name, logo, expense_category_id, income_category_id, category_ids, alias_ids, newAliases } = req.body;

    let finalExpenseCat = expense_category_id;
    let finalIncomeCat = income_category_id;

    // Fallback if frontend isn't updated
    if (!finalExpenseCat && !finalIncomeCat && category_ids && category_ids.length > 0) {
      finalExpenseCat = category_ids[0];
    }

    // Check system supplier prevent deletion/name edit
    const existing = db.prepare("SELECT is_system FROM suppliers WHERE id = ?").get(req.params.id) as { is_system: number };
    if (existing?.is_system === 1) {
      // Cannot change name or aliases
      db.prepare("UPDATE suppliers SET expense_category_id = ?, income_category_id = ? WHERE id = ?")
        .run(finalExpenseCat || null, finalIncomeCat || null, req.params.id);
      return res.json({ success: true });
    }

    const normName = normalizeSupplierName(name);
    const existingSuppliers = db.prepare("SELECT id, name FROM suppliers").all() as any[];
    for (const s of existingSuppliers) {
      if (s.id !== req.params.id && normalizeSupplierName(s.name) === normName) {
        return res.status(400).json({ error: `Já existe um fornecedor cadastrado com o nome "${s.name}".` });
      }
    }

    const finalName = name.trim().toUpperCase();
    const update = db.transaction(() => {
      db.prepare("UPDATE suppliers SET name = ?, logo = ?, expense_category_id = ?, income_category_id = ? WHERE id = ?")
        .run(finalName, logo, finalExpenseCat || null, finalIncomeCat || null, req.params.id);

      // Sync aliases
      // 1. Unlink all current aliases
      db.prepare("UPDATE aliases SET supplier_id = NULL WHERE supplier_id = ?").run(req.params.id);

      // 2. Link selected ones
      if (Array.isArray(alias_ids) && alias_ids.length > 0) {
        const updateAlias = db.prepare("UPDATE aliases SET supplier_id = ? WHERE id = ?");
        for (const aliasId of alias_ids) {
          updateAlias.run(req.params.id, aliasId);
        }
      }

      // 3. Create new ones
      if (Array.isArray(newAliases)) {
        const insertAlias = db.prepare("INSERT INTO aliases (id, name, supplier_id) VALUES (?, ?, ?)");
        for (const aliasName of newAliases) {
          insertAlias.run(uuidv4(), aliasName.toUpperCase(), req.params.id);
        }
      }
    });

    try {
      update();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    try {
      const existing = db.prepare("SELECT is_system FROM suppliers WHERE id = ?").get(req.params.id) as { is_system: number };
      if (existing?.is_system === 1) {
        return res.status(400).json({ error: "Não é possível excluir o fornecedor padrão do sistema." });
      }

      const count = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE supplier_id = ?").get(req.params.id) as { count: number };
      if (count.count > 0) {
        return res.status(400).json({ error: "Não é possível excluir este fornecedor pois ele possui transações vinculadas." });
      }

      const deleteSupplier = db.transaction(() => {
        db.prepare("DELETE FROM aliases WHERE supplier_id = ?").run(req.params.id);
        db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
      });
      deleteSupplier();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Card Routes ---
  app.get("/api/cards", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM cards ORDER BY name").all();
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/cards", async (req, res) => {
    const { name, logo } = req.body;
    const base64Logo = await getBase64FromUrl(logo);
    const sanitizedName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Check for existing
    const allCards = db.prepare("SELECT name FROM cards").all() as { name: string }[];
    const exists = allCards.some(c => c.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === sanitizedName);

    if (exists) {
      return res.status(400).json({ error: "Este cartão já existe." });
    }

    const id = uuidv4();
    try {
      db.prepare("INSERT INTO cards (id, name, logo) VALUES (?, ?, ?)").run(id, name.trim().toUpperCase(), base64Logo);
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/cards/:id", async (req, res) => {
    const { name, logo } = req.body;
    const base64Logo = await getBase64FromUrl(logo);
    const sanitizedName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Check for existing (ignoring self)
    const allCards = db.prepare("SELECT id, name FROM cards WHERE id != ?").all(req.params.id) as { id: string, name: string }[];
    const exists = allCards.some(c => c.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === sanitizedName);

    if (exists) {
      return res.status(400).json({ error: "Já existe outro cartão com este nome." });
    }

    try {
      db.prepare("UPDATE cards SET name = ?, logo = ? WHERE id = ?").run(name.trim().toUpperCase(), base64Logo, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/cards/:id", (req, res) => {
    try {
      // Check if any transaction is using this card
      const inUse = db.prepare("SELECT 1 FROM transactions WHERE card_id = ? LIMIT 1").get(req.params.id);
      if (inUse) {
        return res.status(400).json({ error: "Este cartão não pode ser excluído pois existem transações vinculadas a ele." });
      }

      db.prepare("DELETE FROM cards WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Vite & Client ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true" ? { port: 24678 } : false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
      process.exit(1); // Let the environment process manager handle the restart
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer();
