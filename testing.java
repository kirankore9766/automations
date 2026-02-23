// vulnerable.java
ObjectInputStream in = new ObjectInputStream(request.getInputStream());
Object obj = in.readObject();
