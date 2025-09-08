import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  Package, 
  TrendingUp,
  ShoppingCart,
  Star,
  Camera,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function SellerPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const sellerStats = [
    { label: "Total Products", value: "23", icon: Package, color: "primary" },
    { label: "Total Sales", value: "₹1.2L", icon: DollarSign, color: "success" },
    { label: "Orders", value: "156", icon: ShoppingCart, color: "secondary" },
    { label: "Rating", value: "4.8", icon: Star, color: "warning" },
  ];

  const products = [
    {
      id: 1,
      name: "Premium Tomatoes",
      category: "Vegetables",
      price: 45,
      stock: 500,
      sold: 150,
      status: "active",
      rating: 4.8,
      image: "/api/placeholder/200/150"
    },
    {
      id: 2,
      name: "Organic Wheat Seeds",
      category: "Seeds",
      price: 1200,
      stock: 50,
      sold: 25,
      status: "low-stock",
      rating: 4.9,
      image: "/api/placeholder/200/150"
    },
    {
      id: 3,
      name: "NPK Fertilizer",
      category: "Fertilizers",
      price: 850,
      stock: 0,
      sold: 75,
      status: "out-of-stock",
      rating: 4.6,
      image: "/api/placeholder/200/150"
    }
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      product: "Premium Tomatoes",
      buyer: "Rahul Sharma",
      quantity: "50 kg",
      amount: 2250,
      status: "delivered",
      date: "2 hours ago"
    },
    {
      id: "ORD-002",
      product: "NPK Fertilizer",
      buyer: "Sunita Devi",
      quantity: "2 bags",
      amount: 1700,
      status: "processing",
      date: "5 hours ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "low-stock": return "warning";
      case "out-of-stock": return "destructive";
      case "delivered": return "success";
      case "processing": return "secondary";
      default: return "secondary";
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sellerStats.map((stat) => (
          <Card key={stat.label} className="animate-fade-in">
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 bg-${stat.color}/20 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}`} />
              </div>
              <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <h4 className="font-medium">{order.product}</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.buyer} • {order.quantity} • {order.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{order.amount}</p>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Add Product Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Products</h2>
        <Button onClick={() => setShowAddProduct(true)} variant="hero">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <div className="relative">
              <div className="w-full h-48 bg-accent/50 rounded-t-lg flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
              <Badge 
                className="absolute top-2 right-2" 
                variant={getStatusColor(product.status) as any}
              >
                {product.status.replace('-', ' ')}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-primary">₹{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm">{product.rating}</span>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={product.stock === 0 ? "text-destructive" : "text-foreground"}>
                      {product.stock} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sold:</span>
                    <span>{product.sold} units</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAddProduct = () => (
    <Card className="shadow-elegant max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" placeholder="Enter product name" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select id="category" className="w-full p-2 border rounded-md">
              <option>Select category</option>
              <option>Vegetables</option>
              <option>Fruits</option>
              <option>Seeds</option>
              <option>Fertilizers</option>
              <option>Tools</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" type="number" placeholder="Enter price" />
          </div>
          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input id="stock" type="number" placeholder="Enter stock quantity" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Describe your product..." />
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Upload Product Images</p>
          <p className="text-muted-foreground">Drag & drop or click to select</p>
        </div>

        <div className="flex gap-4">
          <Button variant="hero" className="flex-1">
            <CheckCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowAddProduct(false)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-secondary text-secondary-foreground p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-secondary-foreground/90">Manage your products, orders, and earnings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-card p-2 rounded-lg shadow-sm">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            onClick={() => {setActiveTab("dashboard"); setShowAddProduct(false);}}
            className="flex-1"
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "ghost"}
            onClick={() => {setActiveTab("products"); setShowAddProduct(false);}}
            className="flex-1"
          >
            Products
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            onClick={() => {setActiveTab("orders"); setShowAddProduct(false);}}
            className="flex-1"
          >
            Orders
          </Button>
        </div>

        {/* Content */}
        {showAddProduct ? renderAddProduct() : 
         activeTab === "dashboard" ? renderDashboard() : 
         activeTab === "products" ? renderProducts() :
         <div className="text-center py-12">
           <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
           <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
           <p className="text-muted-foreground">This section is under development</p>
         </div>
        }
      </div>
    </div>
  );
}