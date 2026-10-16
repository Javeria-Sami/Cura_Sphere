using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CuraSphere.Infrastructure.Services.Integration;

public class Hl7SocketListenerService : BackgroundService
{
    private readonly ILogger<Hl7SocketListenerService> _logger;
    private const int Port = 2575; // Standard MLLP HL7 Port

    public Hl7SocketListenerService(ILogger<Hl7SocketListenerService> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var listener = new TcpListener(IPAddress.Any, Port);
        try
        {
            listener.Start();
            _logger.LogInformation("HL7 MLLP Socket Listener Service started listening on port {Port}", Port);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var client = await listener.AcceptTcpClientAsync(stoppingToken);
                    _ = HandleClientAsync(client, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error accepting HL7 client connection.");
                }
            }
        }
        finally
        {
            listener.Stop();
            _logger.LogInformation("HL7 Socket Listener Service stopped.");
        }
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken stoppingToken)
    {
        using (client)
        using (var stream = client.GetStream())
        {
            byte[] buffer = new byte[4096];
            int bytesRead;

            try
            {
                while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, stoppingToken)) > 0)
                {
                    string hl7Message = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    _logger.LogInformation("Received HL7 Message from LIS instrument: {MessagePreview}", 
                        hl7Message.Length > 50 ? hl7Message[..50] + "..." : hl7Message);

                    // Send ACK
                    string ackMessage = "\x0bMSH|^~\\&|CURASPHERE|HOSPITAL|LIS|LAB|20260824000000||ACK^R01|MSG00001|P|2.3.1\rMSA|AA|MSG00001\r\x1c\r";
                    byte[] ackBytes = Encoding.UTF8.GetBytes(ackMessage);
                    await stream.WriteAsync(ackBytes, 0, ackBytes.Length, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing HL7 message stream.");
            }
        }
    }
}
