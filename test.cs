// vulnerable.cs
string password = "Admin@123";
SqlConnection conn = new SqlConnection(
  "Server=myServer;Database=myDB;User Id=admin;Password=" + password);
