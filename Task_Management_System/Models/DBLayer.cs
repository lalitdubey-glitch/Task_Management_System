using Microsoft.Data.SqlClient;
using System.Data;

namespace Task_Management_System.Models
{
    public class DBLayer
    {
        private readonly string _con;
        public DBLayer(IConfiguration config)
        {
            _con = config.GetConnectionString("constr");
        }

        public int ExecuteQuery(string procname, SqlParameter[] parameter)
        {
            using SqlConnection conn = new SqlConnection(_con);
            using SqlCommand cmd = new SqlCommand(procname, conn);
            cmd.CommandType = CommandType.StoredProcedure;
            if (parameter != null)
            {
                cmd.Parameters.AddRange(parameter);
            }
            conn.Open();
            int res = cmd.ExecuteNonQuery();
            return res;

        }

        public DataTable table(string procname, SqlParameter[] parameters)
        {
            using SqlConnection conn = new SqlConnection(_con);
            using SqlCommand cmd = new SqlCommand(procname, conn);
            cmd.CommandType = CommandType.StoredProcedure;
            if (parameters != null)
            {
                cmd.Parameters.AddRange(parameters);
            }
            DataTable dt = new DataTable();
            using SqlDataAdapter sda = new SqlDataAdapter(cmd);
            sda.Fill(dt);
            return dt;
        }
    }
}
